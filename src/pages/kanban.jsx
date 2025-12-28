import AppShell from '../components/Layout/AppShell.jsx';
import dynamic from 'next/dynamic';
import { useGitHubDataContext } from '../contexts/GitHubDataContext.jsx';

const Kanban = dynamic(() => import('../components/Kanban/Kanban.jsx'), {
  ssr: false,
});

export default function KanbanPage() {
  const { data } = useGitHubDataContext();

  return (
    <AppShell>
      <Kanban data={data} />
    </AppShell>
  );
}

