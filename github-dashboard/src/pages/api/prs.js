const { ensureGitHubEnv, getForce } = require('../../lib/api-utils.js');
const prisma = require('../../lib/prisma.js');
const { readJson } = require('../../lib/json-store.js');
const { fetchPullRequests } = require('../../../agentskills/skills/github-manager/scripts/fetch-prs.js');

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
            const stored = await prisma.pullRequest.findMany({ orderBy: { updatedAt: 'desc' } });
            if (stored.length) {
              res.status(200).json(stored);
              return;
            }
          } catch (error) {
            console.warn(`DB read failed: ${error.message}`);
          }
        }
    */

    if (!force) {
      const snapshot = readJson('snapshot.json', null);
      if (snapshot && Array.isArray(snapshot.prs) && snapshot.prs.length) {
        res.status(200).json(snapshot.prs);
        return;
      }
    }

    const prs = await fetchPullRequests({ force });
    res.status(200).json(prs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
