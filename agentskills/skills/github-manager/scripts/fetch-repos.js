const { getUsername, restPaginated } = require('./utils/github-client');
const { withCache } = require('./utils/cache');

const DEFAULT_TTL = 5 * 60 * 1000;

function normalizeRepo(repo, username) {
  const ownerLogin = repo.owner && repo.owner.login ? repo.owner.login : 'unknown';
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: ownerLogin,
    isOwner: ownerLogin.toLowerCase() === username.toLowerCase(),
    isPrivate: repo.private,
    visibility: repo.visibility || (repo.private ? 'private' : 'public'),
    description: repo.description || '',
    language: repo.language || 'Unknown',
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    updatedAt: repo.updated_at,
    createdAt: repo.created_at,
    url: repo.html_url,
  };
}

async function fetchRepos(options = {}) {
  const username = getUsername();
  const cacheKey = `repos_${username}`;
  const ttl = options.cacheTtlMs || DEFAULT_TTL;

  return withCache(
    cacheKey,
    ttl,
    async () => {
      const repos = await restPaginated(
        '/user/repos',
        {
          affiliation: 'owner,collaborator,organization_member',
          sort: 'updated',
          direction: 'desc',
        },
        { perPage: 100, maxPages: 20 }
      );
      return repos.map((repo) => normalizeRepo(repo, username));
    },
    { force: options.force }
  );
}

if (require.main === module) {
  fetchRepos()
    .then((repos) => {
      console.log(JSON.stringify(repos, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = {
  fetchRepos,
};
