import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import { useGitHubDataContext } from '../../contexts/GitHubDataContext.jsx';

export default function AppShell({ children }) {
  const { loading, error, refresh } = useGitHubDataContext();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Navbar status={{ loading, error }} onRefresh={refresh} />
        <main className="app-content">
          {error ? (
            <div className="state-panel error">
              <h3>GitHub API が未設定です</h3>
              <p>{error}</p>
              <p>GITHUB_TOKEN と GITHUB_USERNAME を設定して更新してください。</p>
            </div>
          ) : null}
          {loading ? (
            <div className="state-panel loading">
              <div className="spinner" />
              <p>GitHub データを読み込み中...</p>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
