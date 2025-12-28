const { restPaginated, mapWithConcurrency } = require('./utils/github-client');
const { withCache } = require('./utils/cache');
const { fetchRepos } = require('./fetch-repos');

const DEFAULT_TTL = 5 * 60 * 1000;

function normalizePullRequest(pr, repo) {
  const state = pr.merged_at ? 'merged' : pr.state;
  return {
    id: pr.id,
    number: pr.number,
    repo: repo.fullName,
    repoUrl: repo.url,
    title: pr.title,
    state,
    labels: (pr.labels || []).map((label) => ({
      name: label.name,
      color: label.color,
    })),
    assignee: pr.assignee
      ? { login: pr.assignee.login, avatarUrl: pr.assignee.avatar_url }
      : null,
    author: pr.user
      ? { login: pr.user.login, avatarUrl: pr.user.avatar_url }
      : null,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    closedAt: pr.closed_at,
    mergedAt: pr.merged_at,
    url: pr.html_url,
  };
}

async function fetchPullRequests(options = {}) {
  const repos = options.repos || (await fetchRepos({ force: options.force }));
  const ttl = options.cacheTtlMs || DEFAULT_TTL;
  const cacheKey = `prs_${repos.length}`;

  return withCache(
    cacheKey,
    ttl,
    async () => {
      const results = await mapWithConcurrency(repos, 4, async (repo) => {
        const prs = await restPaginated(
          `/repos/${repo.owner}/${repo.name}/pulls`,
          { state: 'all' },
          { perPage: 100, maxPages: 5 }
        );
        return prs.map((pr) => normalizePullRequest(pr, repo));
      });
      return results.flat();
    },
    { force: options.force }
  );
}

if (require.main === module) {
  fetchPullRequests()
    .then((prs) => {
      console.log(JSON.stringify(prs, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = {
  fetchPullRequests,
};

