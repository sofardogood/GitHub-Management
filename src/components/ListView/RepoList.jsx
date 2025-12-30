import { useState } from 'react';
import { formatRelative } from '../../utils/dateFormatter.js';
import { updateRepoUrl } from '../../services/githubService.js';

function RepoCard({ repo }) {
  const [expanded, setExpanded] = useState(false);
  const [customUrl, setCustomUrl] = useState(repo.customUrl || '');
  const [editingUrl, setEditingUrl] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);

  const handleSaveUrl = async () => {
    setSavingUrl(true);
    try {
      await updateRepoUrl(repo.fullName, customUrl);
      setEditingUrl(false);
    } catch (err) {
      alert('URLの保存に失敗しました: ' + err.message);
    } finally {
      setSavingUrl(false);
    }
  };

  return (
    <div className="repo-card reveal">
      <div>
        <h4>{repo.fullName}</h4>
        <p>{repo.description || '説明なし'}</p>
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
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#6a737d' }}>プロジェクトURL</span>
              {!editingUrl && (
                <button
                  onClick={() => setEditingUrl(true)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    border: '1px solid #d0d7de',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  編集
                </button>
              )}
            </div>
            {editingUrl ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '0.85rem',
                    border: '1px solid #d0d7de',
                    borderRadius: '4px'
                  }}
                />
                <button
                  onClick={handleSaveUrl}
                  disabled={savingUrl}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#2da44e',
                    color: '#fff',
                    cursor: savingUrl ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingUrl ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => { setEditingUrl(false); setCustomUrl(repo.customUrl || ''); }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    border: '1px solid #d0d7de',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
              </div>
            ) : (
              customUrl ? (
                <a href={customUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0366d6', textDecoration: 'none', fontSize: '0.85rem' }}>
                  {customUrl} ↗
                </a>
              ) : (
                <span style={{ color: '#6a737d', fontSize: '0.85rem' }}>未設定</span>
              )
            )}
          </div>
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
