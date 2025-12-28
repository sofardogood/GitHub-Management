import { useEffect, useMemo, useState } from 'react';
import { useGitHubDataContext } from '../../contexts/GitHubDataContext.jsx';
import {
  createRule,
  deleteRule,
  fetchRules,
  runAutomation,
  updateRule,
} from '../../services/githubService.js';
import { formatDateTime } from '../../utils/dateFormatter.js';

const TARGET_OPTIONS = [
  { value: 'issue', label: 'イシュー' },
  { value: 'pr', label: 'プルリクエスト' },
  { value: 'repo', label: 'リポジトリ' },
];

const CONDITION_OPTIONS = {
  issue: [
    { value: 'staleDays', label: '更新停滞（日数）', input: 'number' },
    { value: 'labelContains', label: 'ラベルに含む', input: 'text' },
    { value: 'titleContains', label: 'タイトルに含む', input: 'text' },
  ],
  pr: [
    { value: 'staleDays', label: '更新停滞（日数）', input: 'number' },
    { value: 'labelContains', label: 'ラベルに含む', input: 'text' },
    { value: 'titleContains', label: 'タイトルに含む', input: 'text' },
  ],
  repo: [
    { value: 'noCommitDays', label: 'コミット停止（日数）', input: 'number' },
    { value: 'languageIs', label: '言語一致', input: 'text' },
    { value: 'starsAbove', label: 'スター数以上', input: 'number' },
  ],
};

const TARGET_LABELS = {
  issue: 'イシュー',
  pr: 'プルリクエスト',
  repo: 'リポジトリ',
};

const CONDITION_LABELS = {
  staleDays: '更新停滞（日数）',
  labelContains: 'ラベルに含む',
  titleContains: 'タイトルに含む',
  noCommitDays: 'コミット停止（日数）',
  languageIs: '言語一致',
  starsAbove: 'スター数以上',
};

const SEVERITY_LABELS = {
  low: '低',
  medium: '中',
  high: '高',
};

export default function RulesManager() {
  const { data } = useGitHubDataContext();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMeta, setRunMeta] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    scope: 'global',
    target: 'issue',
    conditionType: 'staleDays',
    conditionValue: '7',
    severity: 'medium',
    message: '',
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await fetchRules();
        if (active) {
          setRules(payload.rules || []);
        }
      } catch (err) {
        if (active) {
          setError('ルールの読み込みに失敗しました。');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const conditionOptions = useMemo(() => {
    return CONDITION_OPTIONS[form.target] || [];
  }, [form.target]);

  const scopeOptions = useMemo(() => {
    return ['global', ...data.repos.map((repo) => repo.fullName)];
  }, [data.repos]);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleTargetChange = (event) => {
    const nextTarget = event.target.value;
    const options = CONDITION_OPTIONS[nextTarget] || [];
    setForm((prev) => ({
      ...prev,
      target: nextTarget,
      conditionType: options[0]?.value || '',
      conditionValue: options[0]?.input === 'number' ? '7' : '',
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('ルール名を入力してください。');
      return;
    }
    setError('');
    try {
      const created = await createRule({
        name: form.name.trim(),
        scope: form.scope,
        conditions: {
          target: form.target,
          type: form.conditionType,
          value: form.conditionValue,
        },
        actions: {
          type: 'alert',
          severity: form.severity,
          message: form.message.trim(),
        },
      });
      setRules((prev) => [...prev, created]);
      setForm((prev) => ({
        ...prev,
        name: '',
        message: '',
      }));
    } catch (err) {
      setError('ルールの作成に失敗しました。');
    }
  };

  const toggleRule = async (rule) => {
    try {
      const updated = await updateRule({
        id: rule.id,
        enabled: !rule.enabled,
      });
      setRules((prev) =>
        prev.map((item) => (item.id === rule.id ? updated : item))
      );
    } catch (err) {
      setError('ルール更新に失敗しました。');
    }
  };

  const removeRule = async (rule) => {
    try {
      await deleteRule(rule.id);
      setRules((prev) => prev.filter((item) => item.id !== rule.id));
    } catch (err) {
      setError('削除に失敗しました。');
    }
  };

  const runRules = async (apply = false) => {
    setRunning(true);
    setError('');
    try {
      const payload = await runAutomation({ apply });
      setResults(payload.results || []);
      setRunMeta(payload);
    } catch (err) {
      setError('自動チェックの実行に失敗しました。');
    } finally {
      setRunning(false);
    }
  };

  const formatRuleCondition = (rule) => {
    const conditions = rule.conditions || {};
    const targetLabel = TARGET_LABELS[conditions.target] || '未設定';
    const conditionLabel = CONDITION_LABELS[conditions.type] || '未設定';
    const value = conditions.value !== undefined ? conditions.value : '';
    return `${targetLabel} / ${conditionLabel}: ${value}`;
  };

  const formatRuleAction = (rule) => {
    const actions = rule.actions || {};
    const label = SEVERITY_LABELS[actions.severity] || actions.severity || '低';
    return `アラート (${label})`;
  };

  return (
    <section className="rules-view">
      <div className="view-header">
        <div>
          <h2>自動化ルール</h2>
          <p>状況に応じてアラートを作成します。</p>
        </div>
      </div>

      {error ? <div className="empty-state">{error}</div> : null}
      {loading ? <div className="empty-state">読み込み中...</div> : null}

      <div className="panel form-panel">
        <div className="panel-header">
          <h3>新規ルール</h3>
          <span>GitHubデータを基に評価</span>
        </div>
        <form className="form-grid" onSubmit={handleCreate}>
          <label>
            ルール名
            <input
              className="input"
              type="text"
              value={form.name}
              onChange={handleChange('name')}
            />
          </label>
          <label>
            対象範囲
            <select
              className="select"
              value={form.scope}
              onChange={handleChange('scope')}
            >
              {scopeOptions.map((scope) => (
                <option key={scope} value={scope}>
                  {scope === 'global' ? '全体' : scope}
                </option>
              ))}
            </select>
          </label>
          <label>
            対象タイプ
            <select
              className="select"
              value={form.target}
              onChange={handleTargetChange}
            >
              {TARGET_OPTIONS.map((target) => (
                <option key={target.value} value={target.value}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            条件
            <select
              className="select"
              value={form.conditionType}
              onChange={handleChange('conditionType')}
            >
              {conditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            条件値
            <input
              className="input"
              type={
                conditionOptions.find((option) => option.value === form.conditionType)
                  ?.input || 'text'
              }
              value={form.conditionValue}
              onChange={handleChange('conditionValue')}
            />
          </label>
          <label>
            アラート強度
            <select
              className="select"
              value={form.severity}
              onChange={handleChange('severity')}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </label>
          <label className="full-width">
            メッセージ (任意)
            <input
              className="input"
              type="text"
              value={form.message}
              onChange={handleChange('message')}
            />
          </label>
          <div className="form-actions full-width">
            <button className="solid-button" type="submit">
              追加
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>ルール一覧</h3>
          <span>{rules.length} 件</span>
        </div>
        {rules.length === 0 ? (
          <div className="empty-state">ルールがありません。</div>
        ) : (
          <div className="rule-list">
            {rules.map((rule) => (
              <div key={rule.id} className="rule-card">
                <div>
                  <div className="rule-title">
                    <strong>{rule.name}</strong>
                    <span className={`status-pill ${rule.enabled ? 'ok' : 'closed'}`}>
                      {rule.enabled ? '有効' : '無効'}
                    </span>
                  </div>
                  <div className="rule-meta">
                    <span>範囲: {rule.scope === 'global' ? '全体' : rule.scope}</span>
                    <span>条件: {formatRuleCondition(rule)}</span>
                    <span>アクション: {formatRuleAction(rule)}</span>
                  </div>
                </div>
                <div className="rule-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => toggleRule(rule)}
                  >
                    {rule.enabled ? '停止' : '有効化'}
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => removeRule(rule)}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>自動チェック</h3>
          <span>
            {runMeta?.generatedAt ? formatDateTime(runMeta.generatedAt) : ''}
          </span>
        </div>
        <div className="section-actions">
          <button
            className="solid-button"
            type="button"
            onClick={() => runRules(false)}
            disabled={running}
          >
            {running ? '実行中...' : 'プレビュー'}
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => runRules(true)}
            disabled={running}
          >
            アラートに追加
          </button>
        </div>
        {runMeta && runMeta.applied ? (
          <div className="muted">アラートに {runMeta.applied} 件追加しました。</div>
        ) : null}
        {!runMeta ? (
          <div className="empty-state">プレビューを実行してください。</div>
        ) : results && results.length === 0 ? (
          <div className="empty-state">該当する項目はありません。</div>
        ) : results ? (
          <div className="result-list">
            {results.map((result) => (
              <div key={result.id} className="result-card">
                <div>
                  <h4>{result.title}</h4>
                  <p>{result.reason}</p>
                  <div className="muted">ルール: {result.ruleName}</div>
                </div>
                <div className="result-meta">
                  <span>{result.repo}</span>
                  {result.url ? (
                    <a href={result.url} target="_blank" rel="noreferrer">
                      開く
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
