const { ensureGitHubEnv, getForce } = require('../../lib/api-utils.js');
const prisma = require('../../lib/prisma.js');
const { writeJson } = require('../../lib/json-store.js');
const { fetchRepos } = require('../../../agentskills/skills/github-manager/scripts/fetch-repos.js');
const { fetchIssues } = require('../../../agentskills/skills/github-manager/scripts/fetch-issues.js');
const { fetchPullRequests } = require('../../../agentskills/skills/github-manager/scripts/fetch-prs.js');
const { fetchCommits } = require('../../../agentskills/skills/github-manager/scripts/fetch-commits.js');
const { fetchRepoContext } = require('../../../agentskills/skills/github-manager/scripts/fetch-repo-context.js');

function toDate(value) {
  return value ? new Date(value) : null;
}

function addEvent(events, event) {
  if (!event.date) return;
  events.push(event);
}

function buildTimeline(issues, prs, commits, limit = 200) {
  const events = [];

  issues.forEach((issue) => {
    addEvent(events, {
      id: `issue-open-${issue.id}`,
      type: 'issue_opened',
      repo: issue.repo,
      title: issue.title,
      actor: issue.author ? issue.author.login : 'unknown',
      date: issue.createdAt,
      url: issue.url,
    });
    if (issue.closedAt) {
      addEvent(events, {
        id: `issue-closed-${issue.id}`,
        type: 'issue_closed',
        repo: issue.repo,
        title: issue.title,
        actor: issue.assignee ? issue.assignee.login : 'unknown',
        date: issue.closedAt,
        url: issue.url,
      });
    }
  });

  prs.forEach((pr) => {
    addEvent(events, {
      id: `pr-open-${pr.id}`,
      type: 'pr_opened',
      repo: pr.repo,
      title: pr.title,
      actor: pr.author ? pr.author.login : 'unknown',
      date: pr.createdAt,
      url: pr.url,
    });
    if (pr.mergedAt) {
      addEvent(events, {
        id: `pr-merged-${pr.id}`,
        type: 'pr_merged',
        repo: pr.repo,
        title: pr.title,
        actor: pr.assignee ? pr.assignee.login : 'unknown',
        date: pr.mergedAt,
        url: pr.url,
      });
    } else if (pr.closedAt) {
      addEvent(events, {
        id: `pr-closed-${pr.id}`,
        type: 'pr_closed',
        repo: pr.repo,
        title: pr.title,
        actor: pr.assignee ? pr.assignee.login : 'unknown',
        date: pr.closedAt,
        url: pr.url,
      });
    }
  });

  commits.forEach((commit) => {
    addEvent(events, {
      id: `commit-${commit.sha}`,
      type: 'commit',
      repo: commit.repo,
      title: commit.message,
      actor: commit.author ? commit.author.login : 'unknown',
      date: commit.date,
      url: commit.url,
    });
  });

  return events
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

async function upsertRepos(repos) {
  for (const repo of repos) {
    await prisma.repo.upsert({
      where: { id: repo.id },
      create: {
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        owner: repo.owner,
        isOwner: repo.isOwner,
        isPrivate: repo.isPrivate,
        visibility: repo.visibility,
        description: repo.description || '',
        language: repo.language || 'Unknown',
        stars: repo.stars,
        forks: repo.forks,
        updatedAt: toDate(repo.updatedAt),
        createdAt: toDate(repo.createdAt),
        url: repo.url,
      },
      update: {
        name: repo.name,
        fullName: repo.fullName,
        owner: repo.owner,
        isOwner: repo.isOwner,
        isPrivate: repo.isPrivate,
        visibility: repo.visibility,
        description: repo.description || '',
        language: repo.language || 'Unknown',
        stars: repo.stars,
        forks: repo.forks,
        updatedAt: toDate(repo.updatedAt),
        createdAt: toDate(repo.createdAt),
        url: repo.url,
      },
    });
  }
}

function buildSnapshot(repos, issues, prs, commits, timeline, contexts) {
  const dependencies = contexts.map((context) => ({
    repoFullName: context.fullName,
    repoId: context.id,
    dependencies: context.dependencies || [],
  }));

  return {
    syncedAt: new Date().toISOString(),
    repos,
    issues,
    prs,
    commits,
    timeline,
    dependencies,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!ensureGitHubEnv(res)) return;

  const force = getForce(req);

  try {
    const repos = await fetchRepos({ force });
    const repoIdMap = new Map(repos.map((repo) => [repo.fullName, repo.id]));

    const [issues, prs, commits, contexts] = await Promise.all([
      fetchIssues({ repos, force }),
      fetchPullRequests({ repos, force }),
      fetchCommits({ repos, force }),
      fetchRepoContext({ repos, force }),
    ]);

    const timeline = buildTimeline(issues, prs, commits);
    const snapshot = buildSnapshot(repos, issues, prs, commits, timeline, contexts);

    /*
        if (prisma) {
          try {
            const run = await prisma.syncRun.create({ data: { status: 'running' } });
    
            await upsertRepos(repos);
            await prisma.repo.deleteMany({
              where: { id: { notIn: repos.map((repo) => repo.id) } },
            });
    
            await prisma.$transaction([
              prisma.issue.deleteMany(),
              prisma.pullRequest.deleteMany(),
              prisma.commit.deleteMany(),
              prisma.timelineEvent.deleteMany(),
              prisma.repoDependency.deleteMany(),
            ]);
    
            if (issues.length) {
              await prisma.issue.createMany({
                data: issues.map((issue) => ({
                  id: issue.id,
                  number: issue.number,
                  repoFullName: issue.repo,
                  repoId: repoIdMap.get(issue.repo) || null,
                  title: issue.title,
                  state: issue.state,
                  labels: issue.labels || [],
                  assignee: issue.assignee,
                  author: issue.author,
                  createdAt: toDate(issue.createdAt),
                  updatedAt: toDate(issue.updatedAt),
                  closedAt: toDate(issue.closedAt),
                  url: issue.url,
                })),
              });
            }
    
            if (prs.length) {
              await prisma.pullRequest.createMany({
                data: prs.map((pr) => ({
                  id: pr.id,
                  number: pr.number,
                  repoFullName: pr.repo,
                  repoId: repoIdMap.get(pr.repo) || null,
                  title: pr.title,
                  state: pr.state,
                  labels: pr.labels || [],
                  assignee: pr.assignee,
                  author: pr.author,
                  createdAt: toDate(pr.createdAt),
                  updatedAt: toDate(pr.updatedAt),
                  closedAt: toDate(pr.closedAt),
                  mergedAt: toDate(pr.mergedAt),
                  url: pr.url,
                })),
              });
            }
    
            if (commits.length) {
              await prisma.commit.createMany({
                data: commits.map((commit) => ({
                  repoFullName: commit.repo,
                  sha: commit.sha,
                  repoId: repoIdMap.get(commit.repo) || null,
                  message: commit.message,
                  author: commit.author,
                  date: toDate(commit.date),
                  url: commit.url,
                })),
              });
            }
    
            if (timeline.length) {
              await prisma.timelineEvent.createMany({
                data: timeline.map((event) => ({
                  id: event.id,
                  type: event.type,
                  repoFullName: event.repo,
                  repoId: repoIdMap.get(event.repo) || null,
                  title: event.title,
                  actor: event.actor,
                  date: toDate(event.date),
                  url: event.url,
                })),
              });
            }
    
            const dependencies = [];
            contexts.forEach((context) => {
              const repoId = repoIdMap.get(context.fullName);
              if (!repoId) return;
              (context.dependencies || []).forEach((name) => {
                dependencies.push({ repoId, name });
              });
            });
            if (dependencies.length) {
              await prisma.repoDependency.createMany({
                data: dependencies,
                skipDuplicates: true,
              });
            }
    
            const stats = {
              repos: repos.length,
              issues: issues.length,
              prs: prs.length,
              commits: commits.length,
              timeline: timeline.length,
              dependencies: snapshot.dependencies.length,
            };
    
            await prisma.syncRun.update({
              where: { id: run.id },
              data: {
                status: 'success',
                finishedAt: new Date(),
                stats,
              },
            });
    
            res.status(200).json({ ok: true, mode: 'db', stats });
            return;
          } catch (error) {
            console.warn(`DB sync failed: ${error.message}`);
          }
        }
    */

    const stats = {
      repos: repos.length,
      issues: issues.length,
      prs: prs.length,
      commits: commits.length,
      timeline: timeline.length,
      dependencies: snapshot.dependencies.length,
    };

    writeJson('snapshot.json', snapshot);
    res.status(200).json({ ok: true, mode: 'file', stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
