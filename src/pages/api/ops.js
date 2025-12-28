const { getForce, ensureGitHubEnv } = require('../../lib/api-utils.js');
const { readJson } = require('../../lib/json-store.js');
const { fetchIssues } = require('../../../agentskills/skills/github-manager/scripts/fetch-issues.js');
const { fetchPullRequests } = require('../../../agentskills/skills/github-manager/scripts/fetch-prs.js');
const { fetchCommits } = require('../../../agentskills/skills/github-manager/scripts/fetch-commits.js');
const { fetchRepos } = require('../../../agentskills/skills/github-manager/scripts/fetch-repos.js');

const STALE_ISSUE_DAYS = 14;
const STALE_PR_DAYS = 7;
const NO_COMMIT_DAYS = 30;

function daysAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  return diff / (1000 * 60 * 60 * 24);
}

function summarizeOps(repos, issues, prs, commits) {
  const openIssues = issues.filter((issue) => issue.state === 'open');
  const openPrs = prs.filter((pr) => pr.state === 'open');

  const staleIssues = openIssues.filter((issue) => daysAgo(issue.updatedAt) >= STALE_ISSUE_DAYS);
  const stalePrs = openPrs.filter((pr) => daysAgo(pr.updatedAt) >= STALE_PR_DAYS);

  const latestCommitByRepo = {};
  commits.forEach((commit) => {
    const prev = latestCommitByRepo[commit.repo];
    if (!prev || new Date(commit.date) > new Date(prev)) {
      latestCommitByRepo[commit.repo] = commit.date;
    }
  });

  const reposNoRecentCommits = repos
    .filter((repo) => {
      const last = latestCommitByRepo[repo.fullName];
      if (!last) return true;
      return daysAgo(last) >= NO_COMMIT_DAYS;
    })
    .map((repo) => ({
      fullName: repo.fullName,
      lastCommitAt: latestCommitByRepo[repo.fullName] || null,
    }))
    .slice(0, 10);

  const reviewQueue = openPrs.reduce((acc, pr) => {
    acc[pr.repo] = (acc[pr.repo] || 0) + 1;
    return acc;
  }, {});

  const reviewQueueList = Object.entries(reviewQueue)
    .map(([repo, count]) => ({ repo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      repos: repos.length,
      openIssues: openIssues.length,
      openPrs: openPrs.length,
      staleIssues: staleIssues.length,
      stalePrs: stalePrs.length,
      reposNoRecentCommits: reposNoRecentCommits.length,
    },
    staleIssues: staleIssues.slice(0, 10),
    stalePrs: stalePrs.slice(0, 10),
    reposNoRecentCommits,
    reviewQueue: reviewQueueList,
  };
}

async function loadData(force) {
  const snapshot = readJson('snapshot.json', null);
  if (!force && snapshot && snapshot.repos) {
    return {
      repos: snapshot.repos || [],
      issues: snapshot.issues || [],
      prs: snapshot.prs || [],
      commits: snapshot.commits || [],
    };
  }

  const [repos, issues, prs, commits] = await Promise.all([
    fetchRepos({ force }),
    fetchIssues({ force }),
    fetchPullRequests({ force }),
    fetchCommits({ force }),
  ]);
  return { repos, issues, prs, commits };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!ensureGitHubEnv(res)) return;

  try {
    const data = await loadData(getForce(req));
    const summary = summarizeOps(data.repos, data.issues, data.prs, data.commits);
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
