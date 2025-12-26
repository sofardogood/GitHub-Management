import AppShell from '../components/Layout/AppShell.jsx';
import ListView from '../components/ListView/ListView.jsx';
import { useGitHubDataContext } from '../contexts/GitHubDataContext.jsx';

export default function HomePage() {
  const { data, loading } = useGitHubDataContext();

  return (
    <AppShell>
      <ListView data={data} loading={loading} mode="compact" />
    </AppShell>
  );
}