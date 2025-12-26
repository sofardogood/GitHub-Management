const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const skillRoot = path.resolve(
  __dirname,
  '..',
  '..',
  'agentskills',
  'skills',
  'github-manager',
  'scripts'
);

const { fetchRepos } = require(path.join(skillRoot, 'fetch-repos.js'));
const { fetchIssues } = require(path.join(skillRoot, 'fetch-issues.js'));
const { fetchPullRequests } = require(path.join(skillRoot, 'fetch-prs.js'));
const { fetchCommits } = require(path.join(skillRoot, 'fetch-commits.js'));
const { fetchStats } = require(path.join(skillRoot, 'fetch-stats.js'));
const { fetchTimeline } = require(path.join(skillRoot, 'fetch-timeline.js'));

const app = express();
app.use(cors());
app.use(express.json());

function requireAuth(res) {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_USERNAME) {
    res.status(500).json({
      error: 'Missing GITHUB_TOKEN or GITHUB_USERNAME in environment.',
    });
    return false;
  }
  return true;
}

function getForce(req) {
  return req.query.refresh === '1' || req.query.refresh === 'true';
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    githubConfigured: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_USERNAME),
  });
});

app.get('/api/repos', async (req, res) => {
  if (!requireAuth(res)) return;
  try {
    const repos = await fetchRepos({ force: getForce(req) });
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/issues', async (req, res) => {
  if (!requireAuth(res)) return;
  try {
    const issues = await fetchIssues({ force: getForce(req) });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/prs', async (req, res) => {
  if (!requireAuth(res)) return;
  try {
    const prs = await fetchPullRequests({ force: getForce(req) });
    res.json(prs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/commits', async (req, res) => {
  if (!requireAuth(res)) return;
  try {
    const commits = await fetchCommits({ force: getForce(req) });
    res.json(commits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  if (!requireAuth(res)) return;
  try {
    const stats = await fetchStats({ force: getForce(req) });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/timeline', async (req, res) => {
  if (!requireAuth(res)) return;
  try {
    const timeline = await fetchTimeline({ force: getForce(req) });
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`GitHub API server listening on port ${port}`);
});
