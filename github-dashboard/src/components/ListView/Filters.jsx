export default function Filters({
  mode,
  filters,
  options,
  onChange,
  view,
  onViewChange,
}) {
  const isRepo = mode === 'repos';

  return (
    <div className="filters">
      <div className="filter-row">
        <label htmlFor="search">検索</label>
        <input
          id="search"
          type="search"
          placeholder={isRepo ? 'リポジトリを検索' : 'イシュー/プルリクエストを検索'}
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </div>

      {isRepo ? (
        <>
          <div className="filter-row">
            <label htmlFor="language">言語</label>
            <select
              id="language"
              value={filters.language}
              onChange={(event) => onChange({ language: event.target.value })}
            >
              {options.languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === 'all' ? 'すべて' : lang}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-row">
            <label htmlFor="visibility">公開範囲</label>
            <select
              id="visibility"
              value={filters.visibility}
              onChange={(event) => onChange({ visibility: event.target.value })}
            >
              {options.visibility.map((item) => (
                <option key={item} value={item}>
                  {item === 'all' ? 'すべて' : item === 'public' ? '公開' : '非公開'}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-row">
            <label htmlFor="sort">並び替え</label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(event) => onChange({ sort: event.target.value })}
            >
              {options.sort.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-row">
            <label>表示</label>
            <div className="toggle-group">
              <button
                className={view === 'grid' ? 'active' : ''}
                type="button"
                onClick={() => onViewChange('grid')}
              >
                カード
              </button>
              <button
                className={view === 'table' ? 'active' : ''}
                type="button"
                onClick={() => onViewChange('table')}
              >
                テーブル
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="filter-row">
            <label htmlFor="status">ステータス</label>
            <select
              id="status"
              value={filters.status}
              onChange={(event) => onChange({ status: event.target.value })}
            >
              {options.status.map((item) => (
                <option key={item} value={item}>
                  {item === 'all'
                    ? 'すべて'
                    : item === 'open'
                      ? 'オープン'
                      : item === 'closed'
                        ? 'クローズ'
                        : 'マージ'}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-row">
            <label htmlFor="repo">リポジトリ</label>
            <select
              id="repo"
              value={filters.repo}
              onChange={(event) => onChange({ repo: event.target.value })}
            >
              {options.repos.map((repo) => (
                <option key={repo} value={repo}>
                  {repo === 'all' ? 'すべて' : repo}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-row">
            <label htmlFor="assignee">担当者</label>
            <select
              id="assignee"
              value={filters.assignee}
              onChange={(event) => onChange({ assignee: event.target.value })}
            >
              {options.assignees.map((assignee) => (
                <option key={assignee} value={assignee}>
                  {assignee === 'all' ? 'すべて' : assignee}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-row">
            <label htmlFor="sort">並び替え</label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(event) => onChange({ sort: event.target.value })}
            >
              {options.sort.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
