const os = require('os');
const path = require('path');
const fs = require('fs');
let prisma;
try {
  prisma = require('../../../../../src/lib/prisma.js');
} catch (e) {
  // If we can't load prisma (e.g. strict environment), fallback to file
}

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

async function readCache(key) {
  // 1. Try DB (CacheEntry)
  if (prisma) {
    try {
      const entry = await prisma.cacheEntry.findUnique({ where: { key } });
      if (entry) {
        if (entry.expiresAt && new Date() > entry.expiresAt) {
          return null; // Expired
        }
        return JSON.parse(entry.data);
      }
    } catch (error) {
      // console.warn('DB cache read failed:', error.message);
    }
  }

  // 2. Fallback to File
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

async function writeCache(key, data, ttlMs) {
  const expiresAt = ttlMs ? new Date(Date.now() + ttlMs) : null;
  const json = JSON.stringify(data);

  // 1. Try DB
  if (prisma) {
    try {
      await prisma.cacheEntry.upsert({
        where: { key },
        create: { key, data: json, expiresAt },
        update: { data: json, expiresAt },
      });
    } catch (error) {
      // console.warn('DB cache write failed:', error.message);
    }
  }

  // 2. Write File (always write file for local speed/fallback)
  try {
    ensureCacheDir();
    const payload = {
      storedAt: Date.now(),
      expiresAt: expiresAt ? expiresAt.getTime() : null,
      data,
    };
    fs.writeFileSync(cacheFilePath(key), JSON.stringify(payload, null, 2));
  } catch (e) {
    // Ignore file write error
  }
}

async function withCache(key, ttlMs, fetcher, options = {}) {
  if (!options.force) {
    const cached = await readCache(key);
    if (cached) {
      return cached;
    }
  }
  const data = await fetcher();
  await writeCache(key, data, ttlMs);
  return data;
}

module.exports = {
  readCache,
  writeCache,
  withCache,
};

