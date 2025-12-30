import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAll, runSync } from '../services/githubService.js';

const AUTO_SYNC_ENABLED = process.env.NEXT_PUBLIC_AUTO_SYNC !== 'false';
const AUTO_SYNC_MINUTES = Number(
  process.env.NEXT_PUBLIC_AUTO_SYNC_INTERVAL_MINUTES || '60' // Changed from 10 to 60 minutes
);
const AUTO_SYNC_MS =
  AUTO_SYNC_ENABLED && Number.isFinite(AUTO_SYNC_MINUTES) && AUTO_SYNC_MINUTES > 0
    ? AUTO_SYNC_MINUTES * 60 * 1000
    : 0;

const initialState = {
  stats: null,
  repos: [],
  issues: [],
  prs: [],
  commits: [],
  timeline: [],
};

function toJapaneseError(message) {
  if (!message) {
    return 'GitHubデータの取得に失敗しました。';
  }
  if (message.includes('Missing GITHUB_TOKEN')) {
    return 'GITHUB_TOKEN と GITHUB_USERNAME を設定してください。';
  }
  if (message.includes('Rate limit')) {
    return 'GitHub API のレート制限に達しました。少し待ってから更新してください。';
  }
  if (message.includes('Git Repository is empty')) {
    return '空のリポジトリが含まれています。';
  }
  return `GitHubデータの取得に失敗しました。 (${message})`;
}

export function useGitHubData() {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const inFlightRef = useRef(false);

  const load = useCallback(async ({ force = false, silent = false } = {}) => {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      if (force) {
        try {
          await runSync({ force: true });
        } catch (syncError) {
          const fallback = await fetchAll({ force: true });
          setData(fallback);
          return;
        }
      }
      const payload = await fetchAll();
      setData(payload);
    } catch (err) {
      setError(toJapaneseError(err.message));
    } finally {
      if (!silent) {
        setLoading(false);
      }
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    // On initial load, use cached data (force: false) to avoid API calls
    load({ force: false, silent: false });
  }, [load]);

  useEffect(() => {
    if (!AUTO_SYNC_MS) {
      return;
    }
    const id = setInterval(() => {
      load({ force: true, silent: true });
    }, AUTO_SYNC_MS);
    return () => clearInterval(id);
  }, [load]);

  return {
    data,
    loading,
    error,
    refresh: () => load({ force: true, silent: false }),
  };
}