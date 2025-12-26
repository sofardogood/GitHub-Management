const { fetchRepos } = require('./fetch-repos');
const { fetchIssues } = require('./fetch-issues');
const { fetchPullRequests } = require('./fetch-prs');
const { fetchCommits } = require('./fetch-commits');
const { fetchLanguageStats } = require('./fetch-language-stats');
const { withCache } = require('./utils/cache');

const DEFAULT_TTL = 5 * 60 * 1000;

function toDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function summarizeLanguages(repos) {
  const totals = {};
  repos.forEach((repo) => {
    const lang = repo.language || 'Unknown';
    totals[lang] = (totals[lang] || 0) + 1;
  });
  return Object.entries(totals)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function buildActivity(commits) {
  const counts = {};
  commits.forEach((commit) => {
    const day = toDateKey(commit.date);
    counts[day] = (counts[day] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-14);
}

function buildRecentUpdates(repos) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return repos
    .filter((repo) => new Date(repo.updatedAt).getTime() >= sevenDaysAgo)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8);
}

async function fetchStats(options = {}) {
  const ttl = options.cacheTtlMs || DEFAULT_TTL;

  return withCache(
    'stats_overview',
    ttl,
    async () => {
      const [repos, issues, prs, commits] = await Promise.all([
        fetchRepos({ force: options.force }),
        fetchIssues({ force: options.force }),
        fetchPullRequests({ force: options.force }),
        fetchCommits({ force: options.force }),
      ]);

      let languageStats = summarizeLanguages(repos);
      try {
        languageStats = await fetchLanguageStats({ force: options.force });
      } catch (error) {
        languageStats = summarizeLanguages(repos);
      }

      const ownerCount = repos.filter((repo) => repo.isOwner).length;
      const totalStars = repos.reduce((sum, repo) => sum + (repo.stars || 0), 0);
      const totalForks = repos.reduce((sum, repo) => sum + (repo.forks || 0), 0);
      const openIssues = issues.filter((issue) => issue.state === 'open').length;
      const closedIssues = issues.filter((issue) => issue.state === 'closed').length;
      const openPrs = prs.filter((pr) => pr.state === 'open').length;
      const mergedPrs = prs.filter((pr) => pr.state === 'merged').length;

      const topRepos = [...repos]
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 5);

      return {
        totals: {
          repos: repos.length,
          ownerRepos: ownerCount,
          collaboratorRepos: repos.length - ownerCount,
          openIssues,
          closedIssues,
          openPrs,
          mergedPrs,
          stars: totalStars,
          forks: totalForks,
        },
        topRepos,
        recentUpdates: buildRecentUpdates(repos),
        languageStats,
        activity: buildActivity(commits),
      };
    },
    { force: options.force }
  );
}

if (require.main === module) {
  fetchStats()
    .then((stats) => {
      console.log(JSON.stringify(stats, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = {
  fetchStats,
};
