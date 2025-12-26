import { useMemo, useState } from 'react';
import EventItem from './EventItem.jsx';
import { TIMELINE_TYPES } from '../../utils/constants.js';
import { formatDate } from '../../utils/dateFormatter.js';

function toDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export default function Timeline({ data, loading }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [repoFilter, setRepoFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const repoOptions = useMemo(() => {
    return ['all', ...data.repos.map((repo) => repo.fullName).sort()];
  }, [data.repos]);

  const filteredEvents = useMemo(() => {
    let events = data.timeline || [];

    if (typeFilter !== 'all') {
      events = events.filter((event) => event.type === typeFilter);
    }
    if (repoFilter !== 'all') {
      events = events.filter((event) => event.repo === repoFilter);
    }
    if (startDate) {
      const start = new Date(startDate).getTime();
      events = events.filter((event) => new Date(event.date).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      events = events.filter((event) => new Date(event.date).getTime() <= end);
    }

    return events;
  }, [data.timeline, endDate, repoFilter, startDate, typeFilter]);

  const grouped = useMemo(() => {
    const groups = {};
    filteredEvents.forEach((event) => {
      const key = toDateKey(event.date);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .map(([date, events]) => ({ date, events }));
  }, [filteredEvents]);

  return (
    <section className="timeline-view">
      <div className="view-header">
        <div>
          <h2>タイムライン</h2>
          <p>コミット・イシュー・プルリクエストを時系列で表示します。</p>
        </div>
      </div>

      <div className="timeline-filters">
        <div className="filter-row">
          <label htmlFor="type">イベント種別</label>
          <select
            id="type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            {TIMELINE_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <label htmlFor="repo">リポジトリ</label>
          <select
            id="repo"
            value={repoFilter}
            onChange={(event) => setRepoFilter(event.target.value)}
          >
            {repoOptions.map((repo) => (
              <option key={repo} value={repo}>
                {repo === 'all' ? 'すべて' : repo}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <label htmlFor="start">開始日</label>
          <input
            id="start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="filter-row">
          <label htmlFor="end">終了日</label>
          <input
            id="end"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
      </div>

      <div className="timeline-stream">
        {loading ? (
          <div className="empty-state">タイムラインを読み込み中...</div>
        ) : grouped.length === 0 ? (
          <div className="empty-state">該当期間のイベントがありません。</div>
        ) : (
          grouped.map((group) => (
            <div key={group.date} className="timeline-group">
              <div className="timeline-date">{formatDate(group.date)}</div>
              <div className="timeline-items">
                {group.events.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
