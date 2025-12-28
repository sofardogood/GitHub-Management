import { formatDateTime } from '../../utils/dateFormatter.js';

const TYPE_LABELS = {
  commit: 'コミット',
  issue_opened: 'イシュー作成',
  issue_closed: 'イシュークローズ',
  pr_opened: 'プルリクエスト作成',
  pr_merged: 'プルリクエストマージ',
  pr_closed: 'プルリクエストクローズ',
};

export default function EventItem({ event }) {
  return (
    <div className={`timeline-item ${event.type}`}>
      <div className="timeline-dot" />
      <div className="timeline-card">
        <div className="timeline-meta">
          <span>{TYPE_LABELS[event.type] || event.type}</span>
          <time>{formatDateTime(event.date)}</time>
        </div>
        <h4>{event.title}</h4>
        <div className="timeline-footer">
          <span>{event.repo}</span>
          <span>作成者 {event.actor}</span>
          <a href={event.url} target="_blank" rel="noreferrer">
            開く
          </a>
        </div>
      </div>
    </div>
  );
}
