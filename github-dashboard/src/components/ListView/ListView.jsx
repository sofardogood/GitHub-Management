import { useEffect, useMemo, useState } from 'react';
import Filters from './Filters.jsx';
import RepoList from './RepoList.jsx';
import IssueList from './IssueList.jsx';
import { useFilters } from '../../hooks/useFilters.js';
import { searchRepos } from '../../services/githubService.js';

const TABS = [
  { id: 'repos', label: 'リポジトリ' },
  { id: 'issues', label: 'イシュー' },
  { id: 'prs', label: 'プルリクエスト' },
];

const REPO_SORT = [
  { value: 'updated', label: '更新日' },
  { value: 'stars', label: 'スター' },
  { value: 'name', label: '名前' },
  { value: 'created', label: '作成日' },
];

const WORK_SORT = [
  { value: 'updated', label: '更新日' },
  { value: 'created', label: '作成日' },
  { value: 'title', label: 'タイトル' },
];

export default function ListView({ data, loading, mode = 'full' }) {
  const [tab, setTab] = useState('repos');
  const [repoView, setRepoView] = useState('grid');
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState([]);
  const [semanticMode, setSemanticMode] = useState('');
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState('');
  const isCompact = mode === 'compact';
  const [filtersOpen, setFiltersOpen] = useState(() => !isCompact);
  const activeTab = isCompact ? 'repos' : tab;

  useEffect(() => {
    if (isCompact) {
      setFiltersOpen(false);
    }
  }, [isCompact]);

  const repoFilters = useFilters({
    search: '',
    language: 'all',
    visibility: 'all',
    sort: 'updated',
  });

  const workFilters = useFilters({
    search: '',
    status: 'all',
    repo: 'all',
    assignee: 'all',
    sort: 'updated',
  });

  const languages = useMemo(() => {
    const list = new Set(data.repos.map((repo) => repo.language || 'Unknown'));
    return ['all', ...Array.from(list).sort()];
  }, [data.repos]);

  const repoNames = useMemo(() => {
    return ['all', ...data.repos.map((repo) => repo.fullName).sort()];
  }, [data.repos]);

  const assignees = useMemo(() => {
    const names = new Set();
    [...data.issues, ...data.prs].forEach((item) => {
      if (item.assignee && item.assignee.login) {
        names.add(item.assignee.login);
      }
    });
    return ['all', ...Array.from(names).sort()];
  }, [data.issues, data.prs]);

  const filteredRepos = useMemo(() => {
    const { search, language, visibility, sort } = repoFilters.filters;
    let repos = data.repos;

    if (search) {
      const query = search.toLowerCase();
      repos = repos.filter(
        (repo) =>
          repo.fullName.toLowerCase().includes(query) ||
          (repo.description || '').toLowerCase().includes(query)
      );
    }
    if (language !== 'all') {
      repos = repos.filter((repo) => repo.language === language);
    }
    if (visibility !== 'all') {
      repos = repos.filter((repo) => repo.visibility === visibility);
    }

    const sorted = [...repos];
    switch (sort) {
      case 'stars':
        sorted.sort((a, b) => b.stars - a.stars);
        break;
      case 'name':
        sorted.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case 'created':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
    }

    return sorted;
  }, [data.repos, repoFilters.filters]);

  const filteredWork = useMemo(() => {
    const source = activeTab === 'issues' ? data.issues : data.prs;
    const { search, status, repo, assignee, sort } = workFilters.filters;
    let items = source;

    if (search) {
      const query = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.repo.toLowerCase().includes(query)
      );
    }
    if (status !== 'all') {
      items = items.filter((item) => item.state === status);
    }
    if (repo !== 'all') {
      items = items.filter((item) => item.repo === repo);
    }
    if (assignee !== 'all') {
      items = items.filter(
        (item) => item.assignee && item.assignee.login === assignee
      );
    }

    const sorted = [...items];
    switch (sort) {
      case 'created':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
    }

    return sorted;
  }, [data.issues, data.prs, activeTab, workFilters.filters]);

  const handleSemanticSearch = async (event) => {
    event.preventDefault();
    const query = semanticQuery.trim();
    if (!query) {
      setSemanticResults([]);
      setSemanticMode('');
      setSemanticError('');
      return;
    }

    setSemanticLoading(true);
    setSemanticError('');
    try {
      const result = await searchRepos(query);
      setSemanticResults(result.items || []);
      setSemanticMode(result.mode || 'keyword');
    } catch (error) {
      setSemanticError('検索に失敗しました。');
    } finally {
      setSemanticLoading(false);
    }
  };

  const handleFiltersToggle = () => {
    setFiltersOpen((prev) => !prev);
  };

  return (
    <section className={`list-view ${isCompact ? 'compact' : ''}`}>
      <div className="semantic-search">
        <div>
          <h3>目的検索（意味検索）</h3>
          <p>例: OCR / 文字認識 / スクレイピング / 画像認識</p>
        </div>
        <form className="semantic-form" onSubmit={handleSemanticSearch}>
          <input
            type="search"
            placeholder="目的を入力"
            value={semanticQuery}
            onChange={(event) => setSemanticQuery(event.target.value)}
          />
          <button type="submit">検索</button>
        </form>
        {semanticMode ? (
          <div className="semantic-mode">
            検索方式: {semanticMode === 'semantic' ? '意味検索' : 'キーワード'}
          </div>
        ) : null}
        {semanticError ? (
          <div className="empty-state">{semanticError}</div>
        ) : null}
        {semanticLoading ? (
          <div className="empty-state">検索中...</div>
        ) : semanticResults.length > 0 ? (
          <div className="semantic-results">
            {semanticResults.map((item) => (
              <div key={item.repo.id} className="repo-card reveal">
                <div>
                  <h4>{item.repo.fullName}</h4>
                  <p>{item.repo.description || '説明なし'}</p>
                </div>
                <div className="repo-meta">
                  <span>{item.repo.language}</span>
                  <span>
                    依存: {item.repo.dependencies.slice(0, 3).join(', ') || 'なし'}
                  </span>
                </div>
                <div className="repo-footer">
                  <span className="semantic-score">
                    {semanticMode === 'semantic'
                      ? `一致度 ${Math.round(item.score * 100)}%`
                      : `一致スコア ${item.score}`}
                  </span>
                  <a href={item.repo.url} target="_blank" rel="noreferrer">
                    開く
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="view-header">
        <div>
          <h2>{isCompact ? '目的検索とリポジトリ一覧' : 'リポジトリ一覧'}</h2>
          <p>
            {isCompact
              ? 'よく使う検索と一覧に集中して整理。'
              : '言語・公開範囲・ステータスで絞り込み。'}
          </p>
        </div>
        {!isCompact ? (
          <div className="tab-row">
            {TABS.map((item) => (
              <button
                key={item.id}
                className={tab === item.id ? 'active' : ''}
                type="button"
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="section-actions">
            <button className="ghost-button" type="button" onClick={handleFiltersToggle}>
              {filtersOpen ? 'フィルターを閉じる' : 'フィルターを開く'}
            </button>
          </div>
        )}
      </div>

      <div className={`list-layout ${isCompact && !filtersOpen ? 'single' : ''}`}>
        {(!isCompact || filtersOpen) && (
          <aside className="filters-panel">
            {isCompact || activeTab === 'repos' ? (
              <Filters
                mode="repos"
                filters={repoFilters.filters}
                options={{
                  languages,
                  visibility: ['all', 'public', 'private'],
                  sort: REPO_SORT,
                }}
                onChange={repoFilters.updateFilters}
                view={repoView}
                onViewChange={setRepoView}
              />
            ) : (
              <Filters
                mode="work"
                filters={workFilters.filters}
                options={{
                  status: ['all', 'open', 'closed', 'merged'],
                  repos: repoNames,
                  assignees,
                  sort: WORK_SORT,
                }}
                onChange={workFilters.updateFilters}
              />
            )}
          </aside>
        )}

        <div className="list-content">
          {loading ? (
            <div className="empty-state">読み込み中...</div>
          ) : isCompact || activeTab === 'repos' ? (
            <RepoList repos={filteredRepos} view={repoView} />
          ) : (
            <IssueList
              items={filteredWork}
              typeLabel={activeTab === 'issues' ? 'イシュー' : 'プルリクエスト'}
            />
          )}
        </div>
      </div>
    </section>
  );
}
