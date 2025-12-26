const { randomUUID } = require('crypto');
const { readJson, writeJson } = require('../../lib/json-store.js');

const FILE_NAME = 'alerts.json';

function ensureShape(data) {
  if (!data || typeof data !== 'object') {
    return { alerts: [] };
  }
  if (!Array.isArray(data.alerts)) {
    return { ...data, alerts: [] };
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = ensureShape(readJson(FILE_NAME, { alerts: [] }));
    res.status(200).json(data);
    return;
  }

  if (req.method === 'POST') {
    const { type, severity, title, message, repo } = req.body || {};
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'title is required.' });
      return;
    }
    const data = ensureShape(readJson(FILE_NAME, { alerts: [] }));
    const alert = {
      id: randomUUID(),
      type: type || 'info',
      severity: severity || 'low',
      title,
      message: message || '',
      repo: repo || '',
      acknowledged: false,
      createdAt: new Date().toISOString(),
    };
    const updated = { ...data, alerts: [alert, ...data.alerts] };
    writeJson(FILE_NAME, updated);
    res.status(201).json(alert);
    return;
  }

  if (req.method === 'PATCH') {
    const { id, acknowledged } = req.body || {};
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'id is required.' });
      return;
    }
    const data = ensureShape(readJson(FILE_NAME, { alerts: [] }));
    const index = data.alerts.findIndex((item) => item.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'alert not found.' });
      return;
    }
    const existing = data.alerts[index];
    const next = {
      ...existing,
      acknowledged: typeof acknowledged === 'boolean' ? acknowledged : existing.acknowledged,
    };
    const updated = {
      ...data,
      alerts: data.alerts.map((item, idx) => (idx === index ? next : item)),
    };
    writeJson(FILE_NAME, updated);
    res.status(200).json(next);
    return;
  }

  if (req.method === 'DELETE') {
    const id = req.query.id ? req.query.id.toString() : '';
    if (!id) {
      res.status(400).json({ error: 'id query param is required.' });
      return;
    }
    const data = ensureShape(readJson(FILE_NAME, { alerts: [] }));
    const remaining = data.alerts.filter((item) => item.id !== id);
    if (remaining.length === data.alerts.length) {
      res.status(404).json({ error: 'alert not found.' });
      return;
    }
    writeJson(FILE_NAME, { ...data, alerts: remaining });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
