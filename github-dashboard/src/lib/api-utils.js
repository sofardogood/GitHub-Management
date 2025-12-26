function ensureGitHubEnv(res) {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_USERNAME) {
    res.status(500).json({
      error: 'Missing GITHUB_TOKEN or GITHUB_USERNAME.',
    });
    return false;
  }
  return true;
}

function getForce(req) {
  return req.query.refresh === '1' || req.query.refresh === 'true';
}

module.exports = {
  ensureGitHubEnv,
  getForce,
};
