const fs = require('fs');
const path = require('path');

const os = require('os');
const cacheDir = path.join(os.tmpdir(), 'github-management-cache');

function ensureCacheDir() {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

function safeKey(key) {
  return key.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

function cacheFilePath(key) {
  return path.join(cacheDir, `${safeKey(key)}.json`);
}

function readCache(key) {
  const file = cacheFilePath(key);
  if (!fs.existsSync(file)) {
    return null;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (raw.expiresAt && Date.now() > raw.expiresAt) {
      return null;
    }
    return raw.data;
  } catch (error) {
    return null;
  }
}

function writeCache(key, data, ttlMs) {
  ensureCacheDir();
  const payload = {
    storedAt: Date.now(),
    expiresAt: ttlMs ? Date.now() + ttlMs : null,
    data,
  };
  fs.writeFileSync(cacheFilePath(key), JSON.stringify(payload, null, 2));
}

async function withCache(key, ttlMs, fetcher, options = {}) {
  if (!options.force) {
    const cached = readCache(key);
    if (cached) {
      return cached;
    }
  }
  const data = await fetcher();
  writeCache(key, data, ttlMs);
  return data;
}

module.exports = {
  readCache,
  writeCache,
  withCache,
};

