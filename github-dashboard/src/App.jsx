import { GitHubDataProvider } from './contexts/GitHubDataContext.jsx';
import AppShell from './components/Layout/AppShell.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import { useGitHubDataContext } from './contexts/GitHubDataContext.jsx';

function AppContent() {
  const { data, loading } = useGitHubDataContext();
  return <Dashboard data={data} loading={loading} />;
}

export default function App() {
  return (
    <GitHubDataProvider>
      <AppShell>
        <AppContent />
      </AppShell>
    </GitHubDataProvider>
  );
}

