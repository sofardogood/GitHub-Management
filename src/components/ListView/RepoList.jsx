import { useState } from 'react';
import { formatRelative } from '../../utils/dateFormatter.js';
import { updateRepoDetails } from '../../services/githubService.js';

function RepoCard({ repo }) {
  const [expanded, setExpanded] = useState(false);
  const [customUrl, setCustomUrl] = useState(repo.customUrl || '');
  const [summary, setSummary] = useState(repo.summary || '');
  const [description, setDescription] = useState(repo.description || '');
  const [editingField, setEditingField] = useState(null); // 'url', 'summary', 'description'
  const [saving, setSaving] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleSave = async (field) => {
    setSaving(true);
    try {
      const updates = {};
      if (field === 'url') updates.customUrl = customUrl;
      if (field === 'summary') updates.summary = summary;
      if (field === 'description') updates.description = description;

      await updateRepoDetails(repo.fullName, updates);
      setEditingField(null);
    } catch (err) {
      alert('保存に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/summary?repo=${repo.fullName}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || '');
      } else {
        alert('AI要約の生成に失敗しました');
      }
    } catch (err) {
      alert('エラー: ' + err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCancel = (field) => {
    if (field === 'url') setCustomUrl(repo.customUrl || '');
    if (field === 'summary') setSummary(repo.summary || '');
    if (field === 'description') setDescription(repo.description || '');
    setEditingField(null);
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    fontSize: '0.85rem',
    border: '1px solid #d0d7de',
    borderRadius: '4px',
    marginTop: '4px'
  };

  const buttonStyle = {
    padding: '6px 12px',
    fontSize: '0.85rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const EditableField = ({ label, field, value, setValue, multiline = false }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#6a737d' }}>{label}</span>
        {editingField !== field && (
          <button
            onClick={() => setEditingField(field)}
            style={{ ...buttonStyle, padding: '2px 8px', fontSize: '0.75rem', border: '1px solid #d0d7de', backgroundColor: '#fff' }}
          >
            編集
          </button>
        )}
        {field === 'summary' && editingField !== field && (
          <button
            onClick={handleGenerateSummary}
            disabled={loadingSummary}
            style={{ ...buttonStyle, padding: '2px 8px', fontSize: '0.75rem', border: '1px solid #d0d7de', backgroundColor: loadingSummary ? '#f6f8fa' : '#fff' }}
          >
            {loadingSummary ? 'AI生成中...' : 'AI生成'}
          </button>
        )}
      </div>
      {editingField === field ? (
        <div>
          {multiline ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            />
          ) : (
            <input
              type={field === 'url' ? 'url' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field === 'url' ? 'https://example.com' : ''}
              style={inputStyle}
            />
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={() => handleSave(field)}
              disabled={saving}
              style={{ ...buttonStyle, backgroundColor: '#2da44e', color: '#fff' }}
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => handleCancel(field)}
              style={{ ...buttonStyle, border: '1px solid #d0d7de', backgroundColor: '#fff' }}
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.9rem', color: value ? '#24292e' : '#6a737d', whiteSpace: 'pre-wrap' }}>
          {field === 'url' && value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#0366d6' }}>{value} ↗</a>
          ) : (
            value || '未設定'
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="repo-card reveal">
      <div>
        <h4>{repo.fullName}</h4>
        <p>{description || '説明なし'}</p>
      </div>
      <div className="repo-meta">
        <span>{repo.language}</span>
        <span>⭐ {repo.stars}</span>
        <span>⑂ {repo.forks}</span>
      </div>
      <div className="repo-footer">
        <span>更新 {formatRelative(repo.updatedAt)}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {customUrl && (
            <a href={customUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2da44e', textDecoration: 'none', fontSize: '0.85rem' }}>
              🔗 サイト
            </a>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '4px 12px',
              fontSize: '0.85rem',
              border: '1px solid #d0d7de',
              borderRadius: '4px',
              backgroundColor: expanded ? '#f6f8fa' : '#fff',
              cursor: 'pointer'
            }}
          >
            {expanded ? '閉じる' : '詳細'}
          </button>
          <a href={repo.url} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>

      {expanded && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#f6f8fa',
          borderRadius: '6px',
          borderTop: '1px solid #d0d7de'
        }}>
          <EditableField label="説明" field="description" value={description} setValue={setDescription} />
          <EditableField label="AI要約" field="summary" value={summary} setValue={setSummary} multiline />
          <EditableField label="プロジェクトURL" field="url" value={customUrl} setValue={setCustomUrl} />
        </div>
      )}
    </div>
  );
}

export default function RepoList({ repos, view }) {
  if (repos.length === 0) {
    return <div className="empty-state">条件に一致するリポジトリがありません。</div>;
  }

  if (view === 'table') {
    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>名前</th>
              <th>言語</th>
              <th>スター</th>
              <th>フォーク</th>
              <th>更新</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo) => (
              <tr key={repo.id}>
                <td>
                  <a href={repo.url} target="_blank" rel="noreferrer">
                    {repo.fullName}
                  </a>
                </td>
                <td>{repo.language}</td>
                <td>{repo.stars}</td>
                <td>{repo.forks}</td>
                <td>{formatRelative(repo.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="repo-grid">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
}
