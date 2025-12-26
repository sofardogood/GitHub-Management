export const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'バックログ' },
  { id: 'in_progress', title: '進行中' },
  { id: 'in_review', title: 'レビュー中' },
  { id: 'done', title: '完了' },
];

export const STATUS_COLORS = {
  open: 'var(--color-info)',
  closed: 'var(--color-muted)',
  merged: 'var(--color-success)',
  done: 'var(--color-success)',
};

export const TIMELINE_TYPES = [
  { id: 'all', label: 'すべて' },
  { id: 'commit', label: 'コミット' },
  { id: 'issue_opened', label: 'イシュー作成' },
  { id: 'issue_closed', label: 'イシュークローズ' },
  { id: 'pr_opened', label: 'プルリクエスト作成' },
  { id: 'pr_merged', label: 'プルリクエストマージ' },
  { id: 'pr_closed', label: 'プルリクエストクローズ' },
];
