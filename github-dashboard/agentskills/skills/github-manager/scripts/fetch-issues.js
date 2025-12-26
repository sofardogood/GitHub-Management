const { restPaginated, mapWithConcurrency } = require('./utils/github-client');
const { withCache } = require('./utils/cache');
const { fetchRepos } = require('./fetch-repos');

const DEFAULT_TTL = 5 * 60 * 1000;

function normalizeIssue(issue, repo) {
  return {
    id: issue.id,
    number: issue.number,
    repo: repo.fullName,
    repoUrl: repo.url,
    title: issue.title,
    state: issue.state,
    labels: (issue.labels || []).map((label) => ({
      name: label.name,
      color: label.color,
    })),
    assignee: issue.assignee
      ? { login: issue.assignee.login, avatarUrl: issue.assignee.avatar_url }
      : null,
    author: issue.user
      ? { login: issue.user.login, avatarUrl: issue.user.avatar_url }
      : null,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at,
    url: issue.html_url,
  };
}

async function fetchIssues(options = {}) {
  const repos = options.repos || (await fetchRepos({ force: options.force }));
  const ttl = options.cacheTtlMs || DEFAULT_TTL;
  const cacheKey = `issues_${repos.length}`;

  return withCache(
    cacheKey,
    ttl,
    async () => {
      const results = await mapWithConcurrency(repos, 4, async (repo) => {
        const issues = await restPaginated(
          `/repos/${repo.owner}/${repo.name}/issues`,
          { state: 'all' },
          { perPage: 100, maxPages: 5 }
        );
        return issues
          .filter((issue) => !issue.pull_request)
          .map((issue) => normalizeIssue(issue, repo));
      });
      return results.flat();
    },
    { force: options.force }
  );
}

if (require.main === module) {
  fetchIssues()
    .then((issues) => {
      console.log(JSON.stringify(issues, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = {
  fetchIssues,
};

