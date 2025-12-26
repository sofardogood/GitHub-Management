const { readJson, writeJson } = require('../../lib/json-store.js');

const FILE_NAME = 'knowledge.json';

function ensureShape(data) {
  if (!data || typeof data !== 'object') {
    return { repos: {} };
  }
  if (!data.repos || typeof data.repos !== 'object') {
    return { ...data, repos: {} };
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = ensureShape(readJson(FILE_NAME, { repos: {} }));
    const repo = req.query.repo ? req.query.repo.toString() : '';
    if (repo && data.repos[repo]) {
      res.status(200).json({ repo, ...data.repos[repo] });
      return;
    }
    res.status(200).json(data);
    return;
  }

  if (req.method === 'POST') {
    const { repo, tags, notes } = req.body || {};
    if (!repo || typeof repo !== 'string') {
      res.status(400).json({ error: 'repo is required.' });
      return;
    }

    const data = ensureShape(readJson(FILE_NAME, { repos: {} }));
    const current = data.repos[repo] || { tags: [], notes: '' };
    const next = {
      tags: Array.isArray(tags) ? tags : current.tags,
      notes: typeof notes === 'string' ? notes : current.notes,
      updatedAt: new Date().toISOString(),
    };
    const updated = {
      ...data,
      repos: {
        ...data.repos,
        [repo]: next,
      },
    };

    writeJson(FILE_NAME, updated);
    res.status(200).json({ repo, ...next });
    return;
  }

  if (req.method === 'DELETE') {
    const repo = req.query.repo ? req.query.repo.toString() : '';
    if (!repo) {
      res.status(400).json({ error: 'repo query param is required.' });
      return;
    }
    const data = ensureShape(readJson(FILE_NAME, { repos: {} }));
    if (!data.repos[repo]) {
      res.status(404).json({ error: 'repo not found.' });
      return;
    }
    const updated = { ...data, repos: { ...data.repos } };
    delete updated.repos[repo];
    writeJson(FILE_NAME, updated);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
