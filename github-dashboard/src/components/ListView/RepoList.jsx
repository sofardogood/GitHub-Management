import { formatRelative } from '../../utils/dateFormatter.js';

export default function RepoList({ repos, view }) {
  if (repos.length === 0) {
    return <div className="empty-state">条件に一致するリポジトリがありません。</div>;
  }

  if (view === 'table') {
    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>名前</th>
              <th>言語</th>
              <th>スター</th>
              <th>フォーク</th>
              <th>更新</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo) => (
              <tr key={repo.id}>
                <td>
                  <a href={repo.url} target="_blank" rel="noreferrer">
                    {repo.fullName}
                  </a>
                </td>
                <td>{repo.language}</td>
                <td>{repo.stars}</td>
                <td>{repo.forks}</td>
                <td>{formatRelative(repo.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="repo-grid">
      {repos.map((repo) => (
        <div key={repo.id} className="repo-card reveal">
          <div>
            <h4>{repo.fullName}</h4>
            <p>{repo.description || '説明なし'}</p>
          </div>
          <div className="repo-meta">
            <span>{repo.language}</span>
            <span>⭐ {repo.stars}</span>
            <span>⑂ {repo.forks}</span>
          </div>
          <div className="repo-footer">
            <span>更新 {formatRelative(repo.updatedAt)}</span>
            <a href={repo.url} target="_blank" rel="noreferrer">
              開く
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
