import { formatDate } from '../../utils/dateFormatter.js';

export default function ActivityChart({ activity = [], languages = [] }) {
  const max = Math.max(...activity.map((item) => item.count), 1);

  return (
    <div className="panel chart-panel">
      <div className="panel-header">
        <h3>アクティビティ</h3>
        <span>直近2週間</span>
      </div>
      <div className="chart-bars">
        {activity.length === 0 ? (
          <div className="empty-state">コミット履歴がまだありません。</div>
        ) : (
          activity.map((item) => (
            <div key={item.date} className="chart-bar">
              <div
                className="chart-bar-fill"
                style={{ height: `${(item.count / max) * 100}%` }}
                title={`${formatDate(item.date)}: ${item.count}`}
              />
              <span>{item.count}</span>
            </div>
          ))
        )}
      </div>
      <div className="language-list">
        {languages.map((lang) => (
          <div key={lang.name} className="language-pill">
            <span>{lang.name}</span>
            <strong>{lang.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
