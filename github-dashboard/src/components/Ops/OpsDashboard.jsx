import { useCallback, useEffect, useState } from 'react';
import StatsCard from '../Dashboard/StatsCard.jsx';
import { fetchOps } from '../../services/githubService.js';
import { formatDateTime, formatRelative } from '../../utils/dateFormatter.js';

export default function OpsDashboard() {
  const [ops, setOps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOps = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchOps({ force });
      setOps(data);
    } catch (err) {
      setError('運用データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOps();
  }, [loadOps]);

  const counts = ops?.counts || {};

  return (
    <section className="ops-view">
      <div className="view-header">
        <div>
          <h2>運用モニタリング</h2>
          <p>滞留タスクやレビュー待ちを一覧化。</p>
        </div>
        <div className="section-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={() => loadOps(true)}
          >
            再計算
          </button>
        </div>
      </div>

      {error ? <div className="empty-state">{error}</div> : null}
      {loading ? <div className="empty-state">読み込み中...</div> : null}

      <div className="stats-grid">
        <StatsCard label="リポジトリ" value={counts.repos || 0} />
        <StatsCard label="未解決イシュー" value={counts.openIssues || 0} />
        <StatsCard label="滞留イシュー" value={counts.staleIssues || 0} />
        <StatsCard label="未解決PR" value={counts.openPrs || 0} />
        <StatsCard label="滞留PR" value={counts.stalePrs || 0} />
        <StatsCard label="コミット停滞" value={counts.reposNoRecentCommits || 0} />
      </div>

      <div className="panel-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>滞留イシュー</h3>
            <span>
              {ops?.generatedAt ? formatDateTime(ops.generatedAt) : ''}
            </span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>リポジトリ</th>
                  <th>タイトル</th>
                  <th>更新</th>
                </tr>
              </thead>
              <tbody>
                {(ops?.staleIssues || []).length === 0 ? (
                  <tr>
                    <td colSpan="3" className="muted">
                      滞留イシューはありません。
                    </td>
                  </tr>
                ) : (
                  ops.staleIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td>{issue.repo}</td>
                      <td>{issue.title}</td>
                      <td>{formatRelative(issue.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>滞留PR</h3>
            <span>
              {ops?.generatedAt ? formatDateTime(ops.generatedAt) : ''}
            </span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>リポジトリ</th>
                  <th>タイトル</th>
                  <th>更新</th>
                </tr>
              </thead>
              <tbody>
                {(ops?.stalePrs || []).length === 0 ? (
                  <tr>
                    <td colSpan="3" className="muted">
                      滞留PRはありません。
                    </td>
                  </tr>
                ) : (
                  ops.stalePrs.map((pr) => (
                    <tr key={pr.id}>
                      <td>{pr.repo}</td>
                      <td>{pr.title}</td>
                      <td>{formatRelative(pr.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>最近コミットなし</h3>
            <span>上位10件</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>リポジトリ</th>
                  <th>最終コミット</th>
                </tr>
              </thead>
              <tbody>
                {(ops?.reposNoRecentCommits || []).length === 0 ? (
                  <tr>
                    <td colSpan="2" className="muted">
                      停滞中のリポジトリはありません。
                    </td>
                  </tr>
                ) : (
                  ops.reposNoRecentCommits.map((repo) => (
                    <tr key={repo.fullName}>
                      <td>{repo.fullName}</td>
                      <td>
                        {repo.lastCommitAt
                          ? formatRelative(repo.lastCommitAt)
                          : '記録なし'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>レビュー待ち</h3>
            <span>PR集中リポジトリ</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>リポジトリ</th>
                  <th>件数</th>
                </tr>
              </thead>
              <tbody>
                {(ops?.reviewQueue || []).length === 0 ? (
                  <tr>
                    <td colSpan="2" className="muted">
                      レビュー待ちはありません。
                    </td>
                  </tr>
                ) : (
                  ops.reviewQueue.map((row) => (
                    <tr key={row.repo}>
                      <td>{row.repo}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
