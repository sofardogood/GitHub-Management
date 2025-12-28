import AppShell from '../components/Layout/AppShell.jsx';
import Dashboard from '../components/Dashboard/Dashboard.jsx';
import { useGitHubDataContext } from '../contexts/GitHubDataContext.jsx';

export default function HomePage() {
  const { data, loading } = useGitHubDataContext();

  return (
    <AppShell>
      <Dashboard data={data} loading={loading} />
    </AppShell>
  );
}