const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const API_BASE = RAW_API_BASE.endsWith('/')
  ? RAW_API_BASE.slice(0, -1)
  : RAW_API_BASE;

function withRefresh(path, options) {
  if (!options || !options.force) {
    return path;
  }
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}refresh=1`;
}

async function request(path, options = {}) {
  const init = {};
  if (options.method) {
    init.method = options.method;
  }
  if (options.body !== undefined) {
    init.method = init.method || 'POST';
    init.headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const text = await response.text();
    let message = text || `Request failed: ${response.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.error) {
        message = parsed.error;
      }
    } catch (error) {
      message = text || `Request failed: ${response.status}`;
    }
    throw new Error(message);
  }
  return response.json();
}

export function fetchRepos(options) {
  return request(withRefresh('/api/repos', options));
}

export function fetchIssues(options) {
  return request(withRefresh('/api/issues', options));
}

export function fetchPrs(options) {
  return request(withRefresh('/api/prs', options));
}

export function fetchCommits(options) {
  return request(withRefresh('/api/commits', options));
}

export function fetchStats(options) {
  return request(withRefresh('/api/stats', options));
}

export function fetchTimeline(options) {
  return request(withRefresh('/api/timeline', options));
}

export function runSync(options) {
  return request(withRefresh('/api/sync', options), { method: 'POST' });
}

export function searchRepos(query) {
  const encoded = encodeURIComponent(query);
  return request(`/api/search?q=${encoded}`);
}

export function fetchKnowledge(repo) {
  const path = repo
    ? `/api/knowledge?repo=${encodeURIComponent(repo)}`
    : '/api/knowledge';
  return request(path);
}

export function saveKnowledge(payload) {
  return request('/api/knowledge', {
    method: 'POST',
    body: payload,
  });
}

export function deleteKnowledge(repo) {
  const path = `/api/knowledge?repo=${encodeURIComponent(repo)}`;
  return request(path, { method: 'DELETE' });
}

export function fetchRules() {
  return request('/api/rules');
}

export function createRule(payload) {
  return request('/api/rules', {
    method: 'POST',
    body: payload,
  });
}

export function updateRule(payload) {
  return request('/api/rules', {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteRule(id) {
  const path = `/api/rules?id=${encodeURIComponent(id)}`;
  return request(path, { method: 'DELETE' });
}

export function fetchAlerts() {
  return request('/api/alerts');
}

export function createAlert(payload) {
  return request('/api/alerts', {
    method: 'POST',
    body: payload,
  });
}

export function updateAlert(payload) {
  return request('/api/alerts', {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteAlert(id) {
  const path = `/api/alerts?id=${encodeURIComponent(id)}`;
  return request(path, { method: 'DELETE' });
}

export function fetchOps(options) {
  return request(withRefresh('/api/ops', options));
}

export function runAutomation({ apply = false, force = false } = {}) {
  const path = withRefresh('/api/automation/run', { force });
  return request(path, {
    method: 'POST',
    body: { apply: Boolean(apply) },
  });
}

export async function fetchAll(options) {
  const [stats, repos, issues, prs, commits, timeline] = await Promise.all([
    fetchStats(options),
    fetchRepos(options),
    fetchIssues(options),
    fetchPrs(options),
    fetchCommits(options),
    fetchTimeline(options),
  ]);

  return {
    stats,
    repos,
    issues,
    prs,
    commits,
    timeline,
  };
}

export function getRepoUrl(repo) {
  return request(`/api/repo-url?repo=${encodeURIComponent(repo)}`);
}

export function updateRepoUrl(repo, customUrl) {
  return request('/api/repo-url', {
    method: 'PATCH',
    body: { repo, customUrl },
  });
}
