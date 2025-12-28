import { formatRelative } from '../../utils/dateFormatter.js';

const STATE_LABELS = {
  open: 'オープン',
  closed: 'クローズ',
  merged: 'マージ',
};

export default function IssueList({ items, typeLabel }) {
  if (items.length === 0) {
    return <div className="empty-state">条件に一致する{typeLabel}がありません。</div>;
  }

  return (
    <div className="work-list">
      {items.map((item) => (
        <div key={item.id} className="work-card reveal">
          <div className="work-title">
            <h4>{item.title}</h4>
            <span className={`status-pill ${item.state}`}>
              {STATE_LABELS[item.state] || item.state}
            </span>
          </div>
          <div className="work-meta">
            <span>{item.repo}</span>
            <span>#{item.number}</span>
            <span>更新 {formatRelative(item.updatedAt)}</span>
          </div>
          <div className="work-labels">
            {item.labels && item.labels.length > 0
              ? item.labels.map((label) => (
                  <span
                    key={label.name}
                    className="label-chip"
                    style={{ borderColor: `#${label.color}` }}
                  >
                    {label.name}
                  </span>
                ))
              : 'ラベルなし'}
          </div>
          <div className="work-footer">
            <div className="assignee">
              {item.assignee ? (
                <>
                  <img src={item.assignee.avatarUrl} alt={item.assignee.login} />
                  <span>{item.assignee.login}</span>
                </>
              ) : (
                <span>未割り当て</span>
              )}
            </div>
            <a href={item.url} target="_blank" rel="noreferrer">
              {typeLabel}を開く
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
