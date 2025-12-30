const { fetchIssues } = require('./fetch-issues');
const { fetchPullRequests } = require('./fetch-prs');
const { fetchCommits } = require('./fetch-commits');
const { withCache } = require('./utils/cache');

const DEFAULT_TTL = 60 * 60 * 1000; // 60 minutes to reduce API calls

function addEvent(events, event) {
  if (!event.date) {
    return;
  }
  events.push(event);
}

async function fetchTimeline(options = {}) {
  const ttl = options.cacheTtlMs || DEFAULT_TTL;
  const limit = options.limit || 200;

  return withCache(
    'timeline_events',
    ttl,
    async () => {
      const [issues, prs, commits] = await Promise.all([
        fetchIssues({ force: options.force }),
        fetchPullRequests({ force: options.force }),
        fetchCommits({ force: options.force }),
      ]);

      const events = [];

      issues.forEach((issue) => {
        addEvent(events, {
          id: `issue-open-${issue.id}`,
          type: 'issue_opened',
          repo: issue.repo,
          title: issue.title,
          actor: issue.author ? issue.author.login : 'unknown',
          date: issue.createdAt,
          url: issue.url,
        });
        if (issue.closedAt) {
          addEvent(events, {
            id: `issue-closed-${issue.id}`,
            type: 'issue_closed',
            repo: issue.repo,
            title: issue.title,
            actor: issue.assignee ? issue.assignee.login : 'unknown',
            date: issue.closedAt,
            url: issue.url,
          });
        }
      });

      prs.forEach((pr) => {
        addEvent(events, {
          id: `pr-open-${pr.id}`,
          type: 'pr_opened',
          repo: pr.repo,
          title: pr.title,
          actor: pr.author ? pr.author.login : 'unknown',
          date: pr.createdAt,
          url: pr.url,
        });
        if (pr.mergedAt) {
          addEvent(events, {
            id: `pr-merged-${pr.id}`,
            type: 'pr_merged',
            repo: pr.repo,
            title: pr.title,
            actor: pr.assignee ? pr.assignee.login : 'unknown',
            date: pr.mergedAt,
            url: pr.url,
          });
        } else if (pr.closedAt) {
          addEvent(events, {
            id: `pr-closed-${pr.id}`,
            type: 'pr_closed',
            repo: pr.repo,
            title: pr.title,
            actor: pr.assignee ? pr.assignee.login : 'unknown',
            date: pr.closedAt,
            url: pr.url,
          });
        }
      });

      commits.forEach((commit) => {
        addEvent(events, {
          id: `commit-${commit.sha}`,
          type: 'commit',
          repo: commit.repo,
          title: commit.message,
          actor: commit.author ? commit.author.login : 'unknown',
          date: commit.date,
          url: commit.url,
        });
      });

      return events
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    },
    { force: options.force }
  );
}

if (require.main === module) {
  fetchTimeline()
    .then((events) => {
      console.log(JSON.stringify(events, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = {
  fetchTimeline,
};

