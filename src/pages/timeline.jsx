import AppShell from '../components/Layout/AppShell.jsx';
import Timeline from '../components/Timeline/Timeline.jsx';
import { useGitHubDataContext } from '../contexts/GitHubDataContext.jsx';

export default function TimelinePage() {
  const { data, loading } = useGitHubDataContext();

  return (
    <AppShell>
      <Timeline data={data} loading={loading} />
    </AppShell>
  );
}

