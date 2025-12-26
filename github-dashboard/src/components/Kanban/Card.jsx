import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function Card({ item, columnId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const statusLabel = {
    open: 'オープン',
    closed: 'クローズ',
    merged: 'マージ',
  }[item.state] || item.state;

  return (
    <div ref={setNodeRef} style={style} className="kanban-card" {...attributes} {...listeners}>
      <div className="kanban-card-title">{item.title}</div>
      <div className="kanban-card-meta">
        <span>{item.repo}</span>
        <span>#{item.number}</span>
      </div>
      <div className="kanban-card-labels">
        {item.labels.length > 0
          ? item.labels.slice(0, 3).map((label) => (
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
      <div className="kanban-card-footer">
        <span className={`status-pill ${item.state}`}>{statusLabel}</span>
        {item.assignee ? (
          <img src={item.assignee.avatarUrl} alt={item.assignee.login} />
        ) : (
          <span className="muted">未割り当て</span>
        )}
      </div>
    </div>
  );
}
