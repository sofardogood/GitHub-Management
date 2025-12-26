import { useEffect, useMemo, useState } from 'react';
import { useGitHubDataContext } from '../../contexts/GitHubDataContext.jsx';
import {
  deleteKnowledge,
  fetchKnowledge,
  saveKnowledge,
} from '../../services/githubService.js';
import { formatDateTime } from '../../utils/dateFormatter.js';

function toTagString(tags) {
  return Array.isArray(tags) ? tags.join(', ') : '';
}

function parseTags(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function KnowledgeHub() {
  const { data } = useGitHubDataContext();
  const [knowledge, setKnowledge] = useState({ repos: {} });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await fetchKnowledge();
        if (active) {
          setKnowledge(payload || { repos: {} });
        }
      } catch (err) {
        if (active) {
          setError('知識ベースの読み込みに失敗しました。');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const repoEntries = useMemo(() => {
    const items = data.repos.map((repo) => {
      const meta = knowledge.repos[repo.fullName] || {};
      return {
        ...repo,
        tags: meta.tags || [],
        notes: meta.notes || '',
        updatedAt: meta.updatedAt || '',
      };
    });

    if (!query) {
      return items;
    }

    const needle = query.toLowerCase();
    return items.filter((repo) => {
      if (repo.fullName.toLowerCase().includes(needle)) return true;
      if (repo.description && repo.description.toLowerCase().includes(needle)) return true;
      if (repo.tags.join(' ').toLowerCase().includes(needle)) return true;
      if (repo.notes.toLowerCase().includes(needle)) return true;
      return false;
    });
  }, [data.repos, knowledge.repos, query]);

  useEffect(() => {
    if (!repoEntries.length) {
      setSelected('');
      return;
    }
    if (!selected || !repoEntries.find((repo) => repo.fullName === selected)) {
      setSelected(repoEntries[0].fullName);
    }
  }, [repoEntries, selected]);

  useEffect(() => {
    if (!selected) {
      setTagsInput('');
      setNotesInput('');
      return;
    }
    const meta = knowledge.repos[selected] || { tags: [], notes: '' };
    setTagsInput(toTagString(meta.tags));
    setNotesInput(meta.notes || '');
  }, [knowledge.repos, selected]);

  const selectedRepo = repoEntries.find((repo) => repo.fullName === selected);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedRepo) return;
    setSaving(true);
    setError('');
    try {
      const payload = await saveKnowledge({
        repo: selectedRepo.fullName,
        tags: parseTags(tagsInput),
        notes: notesInput,
      });
      setKnowledge((prev) => ({
        ...prev,
        repos: {
          ...prev.repos,
          [payload.repo]: {
            tags: payload.tags || [],
            notes: payload.notes || '',
            updatedAt: payload.updatedAt || new Date().toISOString(),
          },
        },
      }));
    } catch (err) {
      setError('保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRepo) return;
    setSaving(true);
    setError('');
    try {
      await deleteKnowledge(selectedRepo.fullName);
      setKnowledge((prev) => {
        const next = { ...prev.repos };
        delete next[selectedRepo.fullName];
        return { ...prev, repos: next };
      });
    } catch (err) {
      setError('削除に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="knowledge-view">
      <div className="view-header">
        <div>
          <h2>知識ベース</h2>
          <p>リポジトリの用途やメモを蓄積。</p>
        </div>
      </div>

      {error ? <div className="empty-state">{error}</div> : null}
      {loading ? <div className="empty-state">読み込み中...</div> : null}

      <div className="knowledge-layout">
        <div className="panel knowledge-sidebar">
          <div className="form-stack">
            <label>
              絞り込み
              <input
                className="input"
                type="search"
                placeholder="OCR / 文字認識 など"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          <div className="knowledge-list">
            {repoEntries.length === 0 ? (
              <div className="empty-state">対象リポジトリがありません。</div>
            ) : (
              repoEntries.map((repo) => (
                <button
                  key={repo.fullName}
                  type="button"
                  className={`knowledge-item ${
                    selected === repo.fullName ? 'active' : ''
                  }`}
                  onClick={() => setSelected(repo.fullName)}
                >
                  <div className="knowledge-item-title">{repo.fullName}</div>
                  <div className="knowledge-item-meta">
                    {repo.tags.length ? repo.tags.join(', ') : 'タグ未設定'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="panel knowledge-detail">
          {selectedRepo ? (
            <form className="form-stack" onSubmit={handleSave}>
              <div>
                <h3>{selectedRepo.fullName}</h3>
                <p className="muted">
                  {selectedRepo.description || '説明なし'}
                </p>
                <div className="tag-list">
                  <span className="tag-pill">{selectedRepo.language}</span>
                  <span className="tag-pill">
                    {selectedRepo.visibility}
                  </span>
                  <span className="tag-pill">
                    {selectedRepo.isOwner ? 'オーナー' : 'コラボ'}
                  </span>
                </div>
                {knowledge.repos[selectedRepo.fullName]?.updatedAt ? (
                  <div className="muted">
                    最終更新: {formatDateTime(
                      knowledge.repos[selectedRepo.fullName].updatedAt
                    )}
                  </div>
                ) : null}
              </div>

              <label>
                タグ
                <input
                  className="input"
                  type="text"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="ocr, 文字認識, スクレイピング"
                />
              </label>

              <label>
                メモ
                <textarea
                  className="textarea"
                  value={notesInput}
                  onChange={(event) => setNotesInput(event.target.value)}
                  placeholder="用途・注意点・引き継ぎ事項など"
                />
              </label>

              <div className="form-actions">
                <button className="solid-button" type="submit" disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  削除
                </button>
              </div>
            </form>
          ) : (
            <div className="empty-state">対象リポジトリを選択してください。</div>
          )}
        </div>
      </div>
    </section>
  );
}
