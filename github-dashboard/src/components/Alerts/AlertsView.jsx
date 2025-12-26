import { useEffect, useMemo, useState } from 'react';
import { useGitHubDataContext } from '../../contexts/GitHubDataContext.jsx';
import {
  createAlert,
  deleteAlert,
  fetchAlerts,
  updateAlert,
} from '../../services/githubService.js';
import { formatDateTime } from '../../utils/dateFormatter.js';

export default function AlertsView() {
  const { data } = useGitHubDataContext();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    message: '',
    repo: '',
    type: 'info',
    severity: 'low',
  });

  const severityLabels = {
    low: '低',
    medium: '中',
    high: '高',
  };

  const typeLabels = {
    info: '情報',
    ops: '運用',
    security: 'セキュリティ',
    automation: '自動化',
  };

  const repoOptions = useMemo(() => {
    return ['', ...data.repos.map((repo) => repo.fullName)];
  }, [data.repos]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await fetchAlerts();
        if (active) {
          setAlerts(payload.alerts || []);
        }
      } catch (err) {
        if (active) {
          setError('アラートの取得に失敗しました。');
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

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('タイトルを入力してください。');
      return;
    }
    setError('');
    try {
      const created = await createAlert({
        title: form.title.trim(),
        message: form.message.trim(),
        repo: form.repo,
        type: form.type,
        severity: form.severity,
      });
      setAlerts((prev) => [created, ...prev]);
      setForm((prev) => ({ ...prev, title: '', message: '' }));
    } catch (err) {
      setError('アラートの作成に失敗しました。');
    }
  };

  const toggleAck = async (alert) => {
    try {
      const updated = await updateAlert({
        id: alert.id,
        acknowledged: !alert.acknowledged,
      });
      setAlerts((prev) =>
        prev.map((item) => (item.id === alert.id ? updated : item))
      );
    } catch (err) {
      setError('更新に失敗しました。');
    }
  };

  const removeAlert = async (alert) => {
    try {
      await deleteAlert(alert.id);
      setAlerts((prev) => prev.filter((item) => item.id !== alert.id));
    } catch (err) {
      setError('削除に失敗しました。');
    }
  };

  return (
    <section className="alerts-view">
      <div className="view-header">
        <div>
          <h2>アラート</h2>
          <p>自動チェックや手動メモを一元管理。</p>
        </div>
      </div>

      {error ? <div className="empty-state">{error}</div> : null}
      {loading ? <div className="empty-state">読み込み中...</div> : null}

      <div className="panel form-panel">
        <div className="panel-header">
          <h3>新規アラート</h3>
          <span>手動追加</span>
        </div>
        <form className="form-grid" onSubmit={handleCreate}>
          <label>
            タイトル
            <input
              className="input"
              type="text"
              value={form.title}
              onChange={handleChange('title')}
            />
          </label>
          <label>
            重要度
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
          <label>
            種別
            <select
              className="select"
              value={form.type}
              onChange={handleChange('type')}
            >
              <option value="info">情報</option>
              <option value="ops">運用</option>
              <option value="security">セキュリティ</option>
            </select>
          </label>
          <label>
            リポジトリ
            <select
              className="select"
              value={form.repo}
              onChange={handleChange('repo')}
            >
              {repoOptions.map((repo) => (
                <option key={repo || 'all'} value={repo}>
                  {repo || '指定なし'}
                </option>
              ))}
            </select>
          </label>
          <label className="full-width">
            内容
            <textarea
              className="textarea"
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

      <div className="alert-list">
        {alerts.length === 0 ? (
          <div className="empty-state">アラートはありません。</div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="alert-card">
              <div className="alert-header">
                <div>
                  <h3>{alert.title}</h3>
                  <div className="alert-meta">
                    <span>{alert.repo || '全体'}</span>
                    <span>{formatDateTime(alert.createdAt)}</span>
                    {alert.ruleName ? <span>ルール: {alert.ruleName}</span> : null}
                  </div>
                </div>
                <div className="alert-badges">
                  <span className={`badge ${alert.severity}`}>
                    {severityLabels[alert.severity] || alert.severity}
                  </span>
                  <span className="badge">
                    {typeLabels[alert.type] || alert.type}
                  </span>
                </div>
              </div>
              {alert.message ? <p>{alert.message}</p> : null}
              <div className="alert-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => toggleAck(alert)}
                >
                  {alert.acknowledged ? '未読に戻す' : '既読にする'}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => removeAlert(alert)}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
