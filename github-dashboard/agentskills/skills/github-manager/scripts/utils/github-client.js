const API_BASE = 'https://api.github.com';
const GRAPHQL_URL = 'https://api.github.com/graphql';

const DEFAULT_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'github-management-system',
};

const fetchImpl = global.fetch;

if (!fetchImpl) {
  throw new Error('Node 18+ is required (global fetch is missing).');
}

function getToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('Missing GITHUB_TOKEN environment variable.');
  }
  return token;
}

function getUsername() {
  const username = process.env.GITHUB_USERNAME;
  if (!username) {
    throw new Error('Missing GITHUB_USERNAME environment variable.');
  }
  return username;
}

function buildUrl(url, params) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      query.set(key, value);
    });
  }
  const queryString = query.toString();
  if (!queryString) {
    return url;
  }
  return `${url}?${queryString}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(url, options = {}, attempt = 0) {
  const headers = {
    ...DEFAULT_HEADERS,
    Authorization: `Bearer ${getToken()}`,
    ...options.headers,
  };

  const response = await fetchImpl(url, {
    ...options,
    headers,
  });

  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = response.headers.get('x-ratelimit-reset');

  if (response.status === 403 && remaining === '0') {
    const resetAt = reset ? Number(reset) * 1000 : Date.now() + 60000;
    const waitMs = resetAt - Date.now();
    if (waitMs > 0 && waitMs < 15000 && attempt < 2) {
      await sleep(waitMs + 250);
      return request(url, options, attempt + 1);
    }
    throw new Error(`Rate limit exceeded. Reset in ${Math.ceil(waitMs / 1000)}s.`);
  }

  if ([429, 502, 503, 504].includes(response.status) && attempt < 2) {
    const delayMs = 500 * Math.pow(2, attempt);
    await sleep(delayMs);
    return request(url, options, attempt + 1);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  return response.json();
}

async function restGet(path, params, options = {}) {
  const url = buildUrl(`${API_BASE}${path}`, params);
  return request(url, {
    method: 'GET',
    ...options,
  });
}

async function restPaginated(path, params = {}, options = {}) {
  const perPage = options.perPage || 100;
  const maxPages = options.maxPages || 10;
  let page = 1;
  let results = [];

  while (page <= maxPages) {
    const data = await restGet(
      path,
      {
        ...params,
        per_page: perPage,
        page,
      },
      options
    );

    if (!Array.isArray(data)) {
      throw new Error('Expected array response for paginated request.');
    }

    results = results.concat(data);
    if (data.length < perPage) {
      break;
    }
    page += 1;
  }

  return results;
}

async function graphqlRequest(query, variables = {}) {
  return request(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

module.exports = {
  getUsername,
  restGet,
  restPaginated,
  graphqlRequest,
  mapWithConcurrency,
};

