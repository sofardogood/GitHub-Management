const { ensureGitHubEnv, getForce } = require('../../lib/api-utils.js');
const prisma = require('../../lib/prisma.js');
const { readJson } = require('../../lib/json-store.js');
const { fetchTimeline } = require('../../../agentskills/skills/github-manager/scripts/fetch-timeline.js');

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
            const stored = await prisma.timelineEvent.findMany({ orderBy: { date: 'desc' } });
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
      if (snapshot && Array.isArray(snapshot.timeline) && snapshot.timeline.length) {
        res.status(200).json(snapshot.timeline);
        return;
      }
    }

    const timeline = await fetchTimeline({ force });
    res.status(200).json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
