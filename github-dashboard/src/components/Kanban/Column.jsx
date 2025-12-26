import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Card from './Card.jsx';

export default function Column({ column, items }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  });

  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? 'over' : ''}`}>
      <div className="kanban-column-header">
        <h4>{column.title}</h4>
        <span>{items.length}</span>
      </div>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-column-body">
          {items.length === 0 ? (
            <div className="empty-state">ここにドラッグして移動</div>
          ) : (
            items.map((item) => (
              <Card key={item.id} item={item} columnId={column.id} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
