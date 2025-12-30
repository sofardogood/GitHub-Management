const { restPaginated, mapWithConcurrency } = require('./utils/github-client');
const { withCache } = require('./utils/cache');
const { fetchRepos } = require('./fetch-repos');

const DEFAULT_TTL = 60 * 60 * 1000; // 60 minutes to reduce API calls

function normalizeCommit(commit, repo) {
  const author = commit.author || commit.commit.author;
  return {
    sha: commit.sha,
    repo: repo.fullName,
    repoUrl: repo.url,
    message: commit.commit.message.split('\n')[0],
    author: author
      ? {
        login: author.login || author.name || 'unknown',
        avatarUrl: author.avatar_url || null,
      }
      : { login: 'unknown', avatarUrl: null },
    date: commit.commit.author.date,
    url: commit.html_url,
  };
}

async function fetchCommits(options = {}) {
  const repos = options.repos || (await fetchRepos({ force: options.force }));
  const ttl = options.cacheTtlMs || DEFAULT_TTL;
  const cacheKey = `commits_${repos.length}`;
  const perRepo = options.perRepo || 20;
  const since = options.since;

  return withCache(
    cacheKey,
    ttl,
    async () => {
      const results = await mapWithConcurrency(repos, 4, async (repo) => {
        try {
          const commits = await restPaginated(
            `/repos/${repo.owner}/${repo.name}/commits`,
            { since },
            { perPage: Math.min(perRepo, 100), maxPages: 1 }
          );
          return commits.map((commit) => normalizeCommit(commit, repo));
        } catch (error) {
          if (
            error.message &&
            (error.message.includes('409') ||
              error.message.includes('Git Repository is empty'))
          ) {
            return [];
          }
          throw error;
        }
      });
      return results.flat();
    },
    { force: options.force }
  );
}

if (require.main === module) {
  fetchCommits()
    .then((commits) => {
      console.log(JSON.stringify(commits, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = {
  fetchCommits,
};

