import Column from './Column.jsx';

export default function Board({ columns, itemsByColumn }) {
  return (
    <div className="kanban-board">
      {columns.map((column) => (
        <Column
          key={column.id}
          column={column}
          items={itemsByColumn[column.id] || []}
        />
      ))}
    </div>
  );
}

