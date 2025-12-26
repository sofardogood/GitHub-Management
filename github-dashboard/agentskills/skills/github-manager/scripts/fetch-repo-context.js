const { restGet, mapWithConcurrency } = require('./utils/github-client');
const { withCache } = require('./utils/cache');
const { fetchRepos } = require('./fetch-repos');

const DEFAULT_TTL = 10 * 60 * 1000;
const README_LIMIT = 4000;

function isNotFound(error) {
  if (!error || !error.message) return false;
  return error.message.includes('404') || error.message.includes('Not Found');
}

function decodeContent(data) {
  if (!data || !data.content) return '';
  const encoding = data.encoding || 'base64';
  try {
    return Buffer.from(data.content, encoding).toString('utf8');
  } catch (error) {
    return '';
  }
}

function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

async function fetchRepoFile(owner, repo, filePath) {
  try {
    const data = await restGet(`/repos/${owner}/${repo}/contents/${filePath}`);
    return decodeContent(data);
  } catch (error) {
    if (isNotFound(error)) {
      return '';
    }
    throw error;
  }
}

async function fetchReadme(owner, repo) {
  try {
    const data = await restGet(`/repos/${owner}/${repo}/readme`);
    return decodeContent(data);
  } catch (error) {
    if (isNotFound(error)) {
      return '';
    }
    return '';
  }
}

function parsePackageJson(content) {
  if (!content) return [];
  try {
    const json = JSON.parse(content);
    const sections = [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ];
    const names = new Set();
    sections.forEach((section) => {
      const deps = json[section];
      if (!deps) return;
      Object.keys(deps).forEach((name) => names.add(name));
    });
    return Array.from(names);
  } catch (error) {
    return [];
  }
}

function parseRequirements(content) {
  if (!content) return [];
  const deps = [];
  content.split(/\r?\n/).forEach((line) => {
    let trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    if (trimmed.startsWith('-r') || trimmed.startsWith('--')) return;
    if (trimmed.includes('#')) {
      trimmed = trimmed.split('#')[0].trim();
    }
    const name = trimmed.split(/[<>=;\[]/)[0].trim();
    if (name) deps.push(name);
  });
  return deps;
}

function parsePyProject(content) {
  if (!content) return [];
  const deps = new Set();

  const listMatch = content.match(/dependencies\s*=\s*\[(.*?)\]/s);
  if (listMatch) {
    const items = listMatch[1].match(/['\"]([^'\"]+)['\"]/g) || [];
    items.forEach((item) => {
      const name = item.replace(/['\"]/g, '').split(/[<>=;]/)[0].trim();
      if (name) deps.add(name);
    });
  }

  let inPoetry = false;
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('[')) {
      inPoetry = trimmed === '[tool.poetry.dependencies]';
      return;
    }
    if (!inPoetry) return;
    const match = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=/);
    if (!match) return;
    const name = match[1];
    if (name && name.toLowerCase() !== 'python') {
      deps.add(name);
    }
  });

  return Array.from(deps);
}

function parsePipfile(content) {
  if (!content) return [];
  const deps = new Set();
  let inSection = '';

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      inSection = trimmed.slice(1, -1);
      return;
    }
    if (inSection !== 'packages' && inSection !== 'dev-packages') return;
    const match = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=/);
    if (match) {
      deps.add(match[1]);
    }
  });

  return Array.from(deps);
}

function parseGoMod(content) {
  if (!content) return [];
  const deps = new Set();
  let inBlock = false;

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('require (')) {
      inBlock = true;
      return;
    }
    if (inBlock && trimmed.startsWith(')')) {
      inBlock = false;
      return;
    }
    if (trimmed.startsWith('require ')) {
      const rest = trimmed.replace(/^require\s+/, '');
      const name = rest.split(' ')[0];
      if (name) deps.add(name);
      return;
    }
    if (inBlock && trimmed) {
      const name = trimmed.split(' ')[0];
      if (name) deps.add(name);
    }
  });

  return Array.from(deps);
}

function parseCargoToml(content) {
  if (!content) return [];
  const deps = new Set();
  let inDependencies = false;

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('[')) {
      inDependencies = trimmed === '[dependencies]' || trimmed === '[dev-dependencies]';
      return;
    }
    if (!inDependencies || !trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=/);
    if (match) {
      deps.add(match[1]);
    }
  });

  return Array.from(deps);
}

async function fetchDependencies(owner, repo) {
  const files = [
    { path: 'package.json', parser: parsePackageJson },
    { path: 'requirements.txt', parser: parseRequirements },
    { path: 'pyproject.toml', parser: parsePyProject },
    { path: 'Pipfile', parser: parsePipfile },
    { path: 'go.mod', parser: parseGoMod },
    { path: 'Cargo.toml', parser: parseCargoToml },
  ];

  const deps = new Set();
  for (const file of files) {
    const content = await fetchRepoFile(owner, repo, file.path);
    if (!content) continue;
    file.parser(content).forEach((name) => deps.add(name));
  }

  return Array.from(deps);
}

function buildContext(repo, readme, dependencies) {
  const blocks = [
    repo.fullName,
    repo.description,
    repo.language,
    dependencies.join(' '),
    truncateText(readme, README_LIMIT),
  ].filter(Boolean);

  return normalizeText(blocks.join('\n'));
}

async function fetchRepoContext(options = {}) {
  const repos = options.repos || (await fetchRepos({ force: options.force }));
  const ttl = options.cacheTtlMs || DEFAULT_TTL;
  const cacheKey = `repo_context_${repos.length}`;

  return withCache(
    cacheKey,
    ttl,
    async () => {
      const results = await mapWithConcurrency(repos, 3, async (repo) => {
        const [readme, dependencies] = await Promise.all([
          fetchReadme(repo.owner, repo.name),
          fetchDependencies(repo.owner, repo.name),
        ]);

        return {
          id: repo.id,
          fullName: repo.fullName,
          description: repo.description || '',
          language: repo.language || 'Unknown',
          url: repo.url,
          updatedAt: repo.updatedAt,
          dependencies,
          text: buildContext(repo, readme, dependencies),
        };
      });
      return results;
    },
    { force: options.force }
  );
}

if (require.main === module) {
  fetchRepoContext()
    .then((contexts) => {
      console.log(JSON.stringify(contexts, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = {
  fetchRepoContext,
};
