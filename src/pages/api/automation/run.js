const { randomUUID } = require('crypto');
const { ensureGitHubEnv, getForce } = require('../../../lib/api-utils.js');
const { readJson, writeJson } = require('../../../lib/json-store.js');
const { fetchIssues } = require('../../../../agentskills/skills/github-manager/scripts/fetch-issues.js');
const { fetchPullRequests } = require('../../../../agentskills/skills/github-manager/scripts/fetch-prs.js');
const { fetchCommits } = require('../../../../agentskills/skills/github-manager/scripts/fetch-commits.js');
const { fetchRepos } = require('../../../../agentskills/skills/github-manager/scripts/fetch-repos.js');

const RULES_FILE = 'rules.json';
const ALERTS_FILE = 'alerts.json';

function ensureRules(data) {
  if (!data || typeof data !== 'object') {
    return { rules: [] };
  }
  if (!Array.isArray(data.rules)) {
    return { ...data, rules: [] };
  }
  return data;
}

function ensureAlerts(data) {
  if (!data || typeof data !== 'object') {
    return { alerts: [] };
  }
  if (!Array.isArray(data.alerts)) {
    return { ...data, alerts: [] };
  }
  return data;
}

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function includesText(source, query) {
  if (!query) return false;
  return normalizeText(source).includes(normalizeText(query));
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function daysSince(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  const diff = Date.now() - new Date(value).getTime();
  return diff / (1000 * 60 * 60 * 24);
}

function latestCommitMap(commits) {
  const map = {};
  commits.forEach((commit) => {
    if (!commit || !commit.repo) return;
    const prev = map[commit.repo];
    if (!prev || new Date(commit.date) > new Date(prev)) {
      map[commit.repo] = commit.date;
    }
  });
  return map;
}

function applyScope(items, scope, repoAccessor) {
  if (!scope || scope === 'global') {
    return items;
  }
  return items.filter((item) => repoAccessor(item) === scope);
}

function buildAction(rule, targetLabel, reason) {
  const actions = rule.actions || {};
  const type = actions.type || 'alert';
  const severity = actions.severity || 'low';
  const message =
    actions.message ||
    `${targetLabel} に対する自動チェック: ${reason}`;
  return { type, severity, message };
}

function buildReason(type, value, item) {
  switch (type) {
    case 'staleDays':
      return `更新が${value}日以上止まっています`;
    case 'labelContains':
      return `ラベルに「${value}」を含みます`;
    case 'titleContains':
      return `タイトルに「${value}」を含みます`;
    case 'noCommitDays':
      return `コミットが${value}日以上ありません`;
    case 'languageIs':
      return `言語が「${item.language || value}」です`;
    case 'starsAbove':
      return `スター数が${value}以上です`;
    default:
      return '条件に一致しました';
  }
}

function evaluateIssueRule(rule, issues) {
  const conditions = rule.conditions || {};
  const type = conditions.type;
  const value = conditions.value;
  const results = [];

  if (!type) return results;

  const candidates = issues.filter((issue) => issue.state === 'open');
  candidates.forEach((issue) => {
    let matched = false;
    if (type === 'staleDays') {
      const days = parseNumber(value);
      if (days !== null && daysSince(issue.updatedAt) >= days) {
        matched = true;
      }
    } else if (type === 'labelContains') {
      if ((issue.labels || []).some((label) => includesText(label.name, value))) {
        matched = true;
      }
    } else if (type === 'titleContains') {
      if (includesText(issue.title, value)) {
        matched = true;
      }
    }

    if (matched) {
      const reason = buildReason(type, value, issue);
      const targetLabel = `${issue.repo} #${issue.number}`;
      results.push({
        id: randomUUID(),
        ruleId: rule.id,
        ruleName: rule.name,
        targetType: 'issue',
        repo: issue.repo,
        title: issue.title,
        number: issue.number,
        url: issue.url,
        reason,
        action: buildAction(rule, targetLabel, reason),
      });
    }
  });

  return results;
}

function evaluatePrRule(rule, prs) {
  const conditions = rule.conditions || {};
  const type = conditions.type;
  const value = conditions.value;
  const results = [];

  if (!type) return results;

  const candidates = prs.filter((pr) => pr.state === 'open');
  candidates.forEach((pr) => {
    let matched = false;
    if (type === 'staleDays') {
      const days = parseNumber(value);
      if (days !== null && daysSince(pr.updatedAt) >= days) {
        matched = true;
      }
    } else if (type === 'labelContains') {
      if ((pr.labels || []).some((label) => includesText(label.name, value))) {
        matched = true;
      }
    } else if (type === 'titleContains') {
      if (includesText(pr.title, value)) {
        matched = true;
      }
    }

    if (matched) {
      const reason = buildReason(type, value, pr);
      const targetLabel = `${pr.repo} #${pr.number}`;
      results.push({
        id: randomUUID(),
        ruleId: rule.id,
        ruleName: rule.name,
        targetType: 'pr',
        repo: pr.repo,
        title: pr.title,
        number: pr.number,
        url: pr.url,
        reason,
        action: buildAction(rule, targetLabel, reason),
      });
    }
  });

  return results;
}

function evaluateRepoRule(rule, repos, commits) {
  const conditions = rule.conditions || {};
  const type = conditions.type;
  const value = conditions.value;
  const results = [];

  if (!type) return results;

  const latestCommit = latestCommitMap(commits);
  repos.forEach((repo) => {
    let matched = false;
    if (type === 'noCommitDays') {
      const days = parseNumber(value);
      const last = latestCommit[repo.fullName];
      if (days !== null && (!last || daysSince(last) >= days)) {
        matched = true;
      }
    } else if (type === 'languageIs') {
      if (includesText(repo.language, value)) {
        matched = true;
      }
    } else if (type === 'starsAbove') {
      const min = parseNumber(value);
      if (min !== null && repo.stars >= min) {
        matched = true;
      }
    }

    if (matched) {
      const reason = buildReason(type, value, repo);
      results.push({
        id: randomUUID(),
        ruleId: rule.id,
        ruleName: rule.name,
        targetType: 'repo',
        repo: repo.fullName,
        title: repo.fullName,
        url: repo.url,
        reason,
        action: buildAction(rule, repo.fullName, reason),
      });
    }
  });

  return results;
}

async function loadData(force) {
  const snapshot = readJson('snapshot.json', null);
  if (!force && snapshot && snapshot.repos) {
    return {
      repos: snapshot.repos || [],
      issues: snapshot.issues || [],
      prs: snapshot.prs || [],
      commits: snapshot.commits || [],
    };
  }

  const repos = await fetchRepos({ force });
  const [issues, prs, commits] = await Promise.all([
    fetchIssues({ repos, force }),
    fetchPullRequests({ repos, force }),
    fetchCommits({ repos, force }),
  ]);

  return { repos, issues, prs, commits };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!ensureGitHubEnv(res)) return;

  const force = getForce(req);
  const apply = Boolean(req.body && req.body.apply);

  try {
    const rulesState = ensureRules(readJson(RULES_FILE, { rules: [] }));
    const enabledRules = rulesState.rules.filter((rule) => rule.enabled !== false);
    const data = await loadData(force);

    const results = [];
    enabledRules.forEach((rule) => {
      const conditions = rule.conditions || {};
      const target = conditions.target;
      if (!target) return;

      if (target === 'issue') {
        const scoped = applyScope(data.issues, rule.scope, (item) => item.repo);
        results.push(...evaluateIssueRule(rule, scoped));
        return;
      }
      if (target === 'pr') {
        const scoped = applyScope(data.prs, rule.scope, (item) => item.repo);
        results.push(...evaluatePrRule(rule, scoped));
        return;
      }
      if (target === 'repo') {
        const scoped = applyScope(data.repos, rule.scope, (item) => item.fullName);
        results.push(...evaluateRepoRule(rule, scoped, data.commits));
      }
    });

    let appliedCount = 0;
    if (apply && results.length) {
      const alertsState = ensureAlerts(readJson(ALERTS_FILE, { alerts: [] }));
      const now = new Date().toISOString();
      const newAlerts = results
        .filter((result) => result.action && result.action.type === 'alert')
        .map((result) => ({
          id: randomUUID(),
          type: 'automation',
          severity: result.action.severity || 'low',
          title: `${result.ruleName}: ${result.title}`,
          message: result.action.message || result.reason,
          repo: result.repo || '',
          acknowledged: false,
          createdAt: now,
          source: 'automation',
          ruleId: result.ruleId,
          ruleName: result.ruleName,
          targetType: result.targetType,
          targetUrl: result.url || '',
        }));

      if (newAlerts.length) {
        writeJson(ALERTS_FILE, {
          ...alertsState,
          alerts: [...newAlerts, ...alertsState.alerts],
        });
        appliedCount = newAlerts.length;
      }
    }

    res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      rules: enabledRules.length,
      results,
      applied: appliedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
