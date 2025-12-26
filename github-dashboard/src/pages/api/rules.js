const { randomUUID } = require('crypto');
const { readJson, writeJson } = require('../../lib/json-store.js');

const FILE_NAME = 'rules.json';

function ensureShape(data) {
  if (!data || typeof data !== 'object') {
    return { rules: [] };
  }
  if (!Array.isArray(data.rules)) {
    return { ...data, rules: [] };
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = ensureShape(readJson(FILE_NAME, { rules: [] }));
    res.status(200).json(data);
    return;
  }

  if (req.method === 'POST') {
    const { name, scope, conditions, actions, enabled } = req.body || {};
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'name is required.' });
      return;
    }
    const data = ensureShape(readJson(FILE_NAME, { rules: [] }));
    const now = new Date().toISOString();
    const rule = {
      id: randomUUID(),
      name,
      scope: scope || 'global',
      conditions: conditions || {},
      actions: actions || {},
      enabled: enabled !== false,
      createdAt: now,
      updatedAt: now,
    };
    const updated = { ...data, rules: [...data.rules, rule] };
    writeJson(FILE_NAME, updated);
    res.status(201).json(rule);
    return;
  }

  if (req.method === 'PATCH') {
    const { id, name, scope, conditions, actions, enabled } = req.body || {};
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'id is required.' });
      return;
    }
    const data = ensureShape(readJson(FILE_NAME, { rules: [] }));
    const index = data.rules.findIndex((rule) => rule.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'rule not found.' });
      return;
    }
    const existing = data.rules[index];
    const updatedRule = {
      ...existing,
      name: typeof name === 'string' ? name : existing.name,
      scope: typeof scope === 'string' ? scope : existing.scope,
      conditions: conditions || existing.conditions,
      actions: actions || existing.actions,
      enabled: typeof enabled === 'boolean' ? enabled : existing.enabled,
      updatedAt: new Date().toISOString(),
    };
    const updated = {
      ...data,
      rules: data.rules.map((rule, idx) => (idx === index ? updatedRule : rule)),
    };
    writeJson(FILE_NAME, updated);
    res.status(200).json(updatedRule);
    return;
  }

  if (req.method === 'DELETE') {
    const id = req.query.id ? req.query.id.toString() : '';
    if (!id) {
      res.status(400).json({ error: 'id query param is required.' });
      return;
    }
    const data = ensureShape(readJson(FILE_NAME, { rules: [] }));
    const remaining = data.rules.filter((rule) => rule.id !== id);
    if (remaining.length === data.rules.length) {
      res.status(404).json({ error: 'rule not found.' });
      return;
    }
    writeJson(FILE_NAME, { ...data, rules: remaining });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
