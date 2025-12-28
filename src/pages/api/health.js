const prisma = require('../../lib/prisma.js');

export default async function handler(req, res) {
  let dbStatus = 'unknown';
  let cacheCount = 0;

  if (prisma) {
    try {
      cacheCount = await prisma.cacheEntry.count();
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'error';
      console.error(e);
    }
  }

  res.status(200).json({
    ok: true,
    githubConfigured: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_USERNAME),
    database: dbStatus,
    cacheEntries: cacheCount,
    timestamp: new Date().toISOString(),
  });
}

