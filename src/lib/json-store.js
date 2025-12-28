const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');

function ensureDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getPath(name) {
  ensureDir();
  return path.join(dataDir, name);
}

function readJson(name, fallback) {
  try {
    const filePath = getPath(name);
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const text = fs.readFileSync(filePath, 'utf8');
    return text ? JSON.parse(text) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(name, data) {
  const filePath = getPath(name);
  const payload = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, payload, 'utf8');
  return data;
}

function updateJson(name, updater, fallback) {
  const current = readJson(name, fallback);
  const next = updater(current || fallback);
  return writeJson(name, next);
}

module.exports = {
  readJson,
  writeJson,
  updateJson,
};
