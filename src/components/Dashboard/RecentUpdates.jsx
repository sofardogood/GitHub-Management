import { formatRelative } from '../../utils/dateFormatter.js';

export default function RecentUpdates({ repos = [] }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>最近の更新</h3>
        <span>直近7日</span>
      </div>
      <div className="updates-list">
        {repos.length === 0 ? (
          <div className="empty-state">最近の更新はありません。</div>
        ) : (
          repos.map((repo) => (
            <div key={repo.id} className="update-row">
              <div>
                <strong>{repo.fullName}</strong>
                <span>{repo.description || '説明なし'}</span>
              </div>
              <div className="update-meta">
                <span>{formatRelative(repo.updatedAt)}</span>
                <a href={repo.url} target="_blank" rel="noreferrer">
                  開く
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
