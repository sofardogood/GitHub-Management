export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    githubConfigured: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_USERNAME),
  });
}

