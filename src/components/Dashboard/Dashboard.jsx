import React, { useMemo, useState } from 'react';
import RepoActivityCard from './RepoActivityCard.jsx';

export default function Dashboard({ data, loading }) {
  const { repos = [], commits = [], issues = [], prs = [] } = data;
  const [searchTerm, setSearchTerm] = useState('');

  // Process data to group by repository and sort by latest activity
  const repoActivities = useMemo(() => {
    if (!repos.length) return [];

    const activityMap = new Map();

    // Initialize map with repos
    repos.forEach(repo => {
      activityMap.set(repo.id, {
        repo,
        activity: []
      });
    });

    // Add Commits
    commits.forEach(commit => {
      const repoId = commit.repository?.id || commit.repoId; // Adjust based on actual data structure
      if (activityMap.has(repoId)) {
        activityMap.get(repoId).activity.push({
          type: 'commit',
          title: commit.message,
          url: commit.html_url,
          date: commit.author?.date || commit.commit?.author?.date, // Adjust based on API response
          author: commit.author?.name || commit.commit?.author?.name || 'Unknown'
        });
      }
    });

    // Add Issues
    issues.forEach(issue => {
      const repoId = issue.repository?.id || issue.repository_id; // Check data structure
      let targetRepoId = null;
      if (issue.repository && issue.repository.id) {
        targetRepoId = issue.repository.id;
      } else if (issue.repository_url) {
        // expensive look up but safe
        const match = repos.find(r => issue.repository_url.includes(r.name));
        if (match) targetRepoId = match.id;
      }

      if (targetRepoId && activityMap.has(targetRepoId)) {
        activityMap.get(targetRepoId).activity.push({
          type: 'issue',
          title: `#${issue.number} ${issue.title}`,
          url: issue.html_url,
          date: issue.created_at,
          author: issue.user?.login || 'Unknown'
        });
      }
    });

    // Add PRs
    prs.forEach(pr => {
      let targetRepoId = null;
      if (pr.head && pr.head.repo && pr.head.repo.id) {
        targetRepoId = pr.head.repo.id;
      } else if (pr.repository_url) {
        const match = repos.find(r => pr.repository_url.includes(r.name));
        if (match) targetRepoId = match.id;
      }

      if (targetRepoId && activityMap.has(targetRepoId)) {
        activityMap.get(targetRepoId).activity.push({
          type: 'pr',
          title: `#${pr.number} ${pr.title}`,
          url: pr.html_url,
          date: pr.created_at,
          author: pr.user?.login || 'Unknown'
        });
      }
    });

    // Sort activities within each repo and determine last active date
    const result = Array.from(activityMap.values()).map(item => {
      item.activity.sort((a, b) => new Date(b.date) - new Date(a.date));
      item.lastActiveDate = item.activity.length > 0 ? item.activity[0].date : item.repo.pushedAt || item.repo.updated_at; // Fallback to repo update time
      return item;
    });

    // Sort repos by last active date (descending)
    result.sort((a, b) => new Date(b.lastActiveDate) - new Date(a.lastActiveDate));

    return result;
  }, [repos, commits, issues, prs]);

  // Filter and limit results
  const displayedRepos = useMemo(() => {
    let filtered = repoActivities;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.repo.fullName.toLowerCase().includes(lowerTerm)
      );
    }

    // Limit to top 10 if no search term, otherwise show all matches
    return searchTerm ? filtered : filtered.slice(0, 10);
  }, [repoActivities, searchTerm]);

  if (loading && repos.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>;
  }

  return (
    <section className="dashboard-view" style={{ maxWidth: '600px', margin: '40px auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="リポジトリを検索 (例: ONE)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '1rem',
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div className="repo-list">
        {displayedRepos.map(({ repo, activity }) => (
          <RepoActivityCard key={repo.id} repo={repo} activity={activity} />
        ))}
        {displayedRepos.length === 0 && (
          <div className="empty-state" style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
            表示できるアクティビティがありません。
          </div>
        )}
      </div>
    </section>
  );
}
