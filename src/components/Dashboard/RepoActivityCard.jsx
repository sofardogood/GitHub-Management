import React, { useState } from 'react';

export default function RepoActivityCard({ repo, activity }) {
  const lastEvent = activity.length > 0 ? activity[0] : null;
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState(repo.summary || null);
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);
    if (!summary && !loading) {
      setLoading(true);
      try {
        const res = await fetch(`/api/summary?repo=${repo.fullName}`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary || '要約が生成されませんでした。');
        } else {
          setSummary('要約の取得に失敗しました。');
        }
      } catch (err) {
        setSummary('エラーが発生しました。');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="repo-activity-card" style={{
      borderBottom: '1px solid #eaecef',
      backgroundColor: '#fff',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    }} onClick={handleExpand}>

      <div style={{ padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontWeight: '600',
            fontSize: '1rem',
            color: '#24292e',
            marginRight: '12px',
            textDecoration: expanded ? 'underline' : 'none'
          }}>
            {repo.fullName}
          </span>

          {!expanded && (
            lastEvent ? (
              <span style={{ fontSize: '0.9rem', color: '#586069', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                — {lastEvent.title}
              </span>
            ) : (
              <span style={{ fontSize: '0.9rem', color: '#6a737d' }}>— 更新なし</span>
            )
          )}
        </div>
        <div style={{ color: '#586069', fontSize: '0.8rem', marginLeft: '10px' }}>
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {expanded && (
        <div style={{
          paddingBottom: '12px',
          fontSize: '0.9rem',
          color: '#444',
          lineHeight: '1.6',
          borderTop: '1px dashed #eaecef',
          marginTop: '4px',
          paddingTop: '8px'
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '0.85rem', color: '#6a737d' }}>
            AI 要約 (README)
          </div>
          {loading ? (
            <div style={{ fontStyle: 'italic', color: '#6a737d' }}>AIが要約を生成中...</div>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>{summary}</div>
          )}
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0366d6', textDecoration: 'none', fontSize: '0.85rem' }}>
              GitHubで見る ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
