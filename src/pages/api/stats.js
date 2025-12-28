const { ensureGitHubEnv, getForce } = require('../../lib/api-utils.js');
const prisma = require('../../lib/prisma.js');
const { readJson } = require('../../lib/json-store.js');
const { buildStatsFromData } = require('../../lib/stats.js');
const { fetchStats } = require('../../../agentskills/skills/github-manager/scripts/fetch-stats.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!ensureGitHubEnv(res)) return;

  const force = getForce(req);

  try {
    /*
        if (prisma && !force) {
          try {
            const [repos, issues, prs, commits] = await Promise.all([
              prisma.repo.findMany(),
              prisma.issue.findMany(),
              prisma.pullRequest.findMany(),
              prisma.commit.findMany({ orderBy: { date: 'desc' }, take: 400 }),
            ]);
    
            if (repos.length) {
              const stats = buildStatsFromData(repos, issues, prs, commits);
              res.status(200).json(stats);
              return;
            }
          } catch (error) {
            console.warn(`DB read failed: ${error.message}`);
          }
        }
    */

    if (!force) {
      const snapshot = readJson('snapshot.json', null);
      if (snapshot && Array.isArray(snapshot.repos) && snapshot.repos.length) {
        const stats = buildStatsFromData(
          snapshot.repos || [],
          snapshot.issues || [],
          snapshot.prs || [],
          snapshot.commits || []
        );
        res.status(200).json(stats);
        return;
      }
    }

    const stats = await fetchStats({ force });
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
