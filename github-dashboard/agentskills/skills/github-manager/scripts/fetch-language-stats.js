const { graphqlRequest } = require('./utils/github-client');
const { withCache } = require('./utils/cache');

const DEFAULT_TTL = 5 * 60 * 1000;

const QUERY = `
  query RepoLanguages($cursor: String) {
    viewer {
      repositories(first: 50, after: $cursor, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
        nodes {
          nameWithOwner
          primaryLanguage {
            name
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

async function fetchLanguageStats(options = {}) {
  const ttl = options.cacheTtlMs || DEFAULT_TTL;

  return withCache(
    'language_stats_graphql',
    ttl,
    async () => {
      const totals = {};
      let cursor = null;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await graphqlRequest(QUERY, { cursor });
        if (response.errors) {
          throw new Error(response.errors.map((err) => err.message).join(', '));
        }
        const repoData = response.data.viewer.repositories;
        repoData.nodes.forEach((repo) => {
          const name = repo.primaryLanguage ? repo.primaryLanguage.name : 'Unknown';
          totals[name] = (totals[name] || 0) + 1;
        });
        hasNextPage = repoData.pageInfo.hasNextPage;
        cursor = repoData.pageInfo.endCursor;
      }

      return Object.entries(totals)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    },
    { force: options.force }
  );
}

if (require.main === module) {
  fetchLanguageStats()
    .then((stats) => {
      console.log(JSON.stringify(stats, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = {
  fetchLanguageStats,
};

