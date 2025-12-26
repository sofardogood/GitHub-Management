import StatsCard from './StatsCard.jsx';
import ActivityChart from './ActivityChart.jsx';
import RecentUpdates from './RecentUpdates.jsx';

export default function Dashboard({ data, loading }) {
  const stats = data.stats || {
    totals: {
      repos: 0,
      ownerRepos: 0,
      collaboratorRepos: 0,
      openIssues: 0,
      closedIssues: 0,
      openPrs: 0,
      mergedPrs: 0,
      stars: 0,
      forks: 0,
    },
    topRepos: [],
    recentUpdates: [],
    languageStats: [],
    activity: [],
  };

  return (
    <section className="dashboard-view">
      <div className="stats-grid">
        <StatsCard
          label="総リポジトリ数"
          value={stats.totals.repos}
          sublabel={`${stats.totals.ownerRepos} オーナー / ${stats.totals.collaboratorRepos} コラボレーター`}
        />
        <StatsCard
          label="未解決イシュー"
          value={stats.totals.openIssues}
          sublabel={`${stats.totals.closedIssues} クローズ`}
        />
        <StatsCard
          label="未解決プルリクエスト"
          value={stats.totals.openPrs}
          sublabel={`${stats.totals.mergedPrs} マージ`}
        />
        <StatsCard
          label="スター"
          value={stats.totals.stars}
          sublabel={`${stats.totals.forks} フォーク`}
        />
      </div>

      <div className="dashboard-grid">
        <ActivityChart
          activity={stats.activity}
          languages={stats.languageStats}
        />
        <div className="panel">
          <div className="panel-header">
            <h3>人気リポジトリ</h3>
            <span>スター順</span>
          </div>
          <div className="top-repos">
            {stats.topRepos.length === 0 ? (
              <div className="empty-state">リポジトリがありません。</div>
            ) : (
              stats.topRepos.map((repo) => (
                <div key={repo.id} className="top-repo">
                  <div>
                    <strong>{repo.fullName}</strong>
                    <span>{repo.description || '説明なし'}</span>
                  </div>
                  <div className="repo-metrics">
                    <span>⭐ {repo.stars}</span>
                    <span>⑂ {repo.forks}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <RecentUpdates repos={stats.recentUpdates} loading={loading} />
    </section>
  );
}
