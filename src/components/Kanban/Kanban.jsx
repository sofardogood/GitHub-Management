import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Board from './Board.jsx';
import { KANBAN_COLUMNS } from '../../utils/constants.js';

function normalizeStatus(labels, state) {
  const names = labels.map((label) => label.name.toLowerCase());
  if (names.some((name) => name.includes('in progress'))) return 'in_progress';
  if (names.some((name) => name.includes('review'))) return 'in_review';
  if (names.some((name) => name.includes('done'))) return 'done';
  if (state === 'closed' || state === 'merged') return 'done';
  return 'backlog';
}

function buildItems(issues, prs) {
  const work = [...issues, ...prs].slice(0, 80);
  return work.map((item) => ({
    id: `${item.id}`,
    number: item.number,
    repo: item.repo,
    title: item.title,
    labels: item.labels || [],
    assignee: item.assignee,
    state: item.state,
    columnId: normalizeStatus(item.labels || [], item.state),
  }));
}

export default function Kanban({ data }) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(buildItems(data.issues, data.prs));
  }, [data.issues, data.prs]);

  const itemsByColumn = useMemo(() => {
    const grouped = {};
    KANBAN_COLUMNS.forEach((column) => {
      grouped[column.id] = [];
    });
    items.forEach((item) => {
      if (!grouped[item.columnId]) {
        grouped[item.columnId] = [];
      }
      grouped[item.columnId].push(item);
    });
    return grouped;
  }, [items]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    setItems((prev) => {
      const activeIndex = prev.findIndex((item) => item.id === active.id);
      const overIndex = prev.findIndex((item) => item.id === over.id);
      const activeItem = prev[activeIndex];

      const overColumnId = KANBAN_COLUMNS.some((col) => col.id === over.id)
        ? over.id
        : over.data.current?.columnId;

      if (!overColumnId || !activeItem) {
        return prev;
      }

      if (overIndex !== -1 && prev[overIndex].columnId === activeItem.columnId) {
        return arrayMove(prev, activeIndex, overIndex);
      }

      return prev.map((item) =>
        item.id === active.id ? { ...item, columnId: overColumnId } : item
      );
    });
  };

  return (
    <section className="kanban-view">
      <div className="view-header">
        <div>
          <h2>作業カンバン</h2>
          <p>ドラッグ＆ドロップで状態を整理できます。</p>
        </div>
        <div className="kanban-note">
          ドラッグ操作は画面上のみで、GitHubには反映されません。
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Board columns={KANBAN_COLUMNS} itemsByColumn={itemsByColumn} />
      </DndContext>
    </section>
  );
}
