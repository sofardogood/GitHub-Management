---
name: github-manager
description: Fetch and manage GitHub repositories (owner + collaborator), issues, PRs, commits, timeline data, and repository metadata (homepage, topics, languages).
---

# GitHub Manager Skill

This skill provides modular scripts for collecting and synchronizing GitHub data using a Personal Access Token (PAT).

## Required Environment Variables
- `GITHUB_TOKEN`: GitHub Personal Access Token (`repo`, `read:org`, `read:user` scopes)
- `GITHUB_USERNAME`: GitHub username

## Scripts Overview

| Script | Purpose |
| :--- | :--- |
| `scripts/fetch-repos.js` | Fetches repositories (owner, collaborator, organization member), including metadata such as `homepage` (project/deployment URL), language, stars, and forks. |
| `scripts/fetch-issues.js` | Fetches open and closed issues across repositories. |
| `scripts/fetch-prs.js` | Fetches pull requests with review and merge status. |
| `scripts/fetch-commits.js` | Fetches recent commit history across repositories. |
| `scripts/fetch-repo-context.js` | Gathers repository descriptions, dependencies (`package.json`, `requirements.txt`), and context for semantic search. |
| `scripts/fetch-language-stats.js` | Uses GitHub GraphQL API v4 to fetch language byte breakdowns. |
| `scripts/fetch-stats.js` | Aggregates summary statistics across repositories, issues, and PRs. |
| `scripts/fetch-timeline.js` | Normalizes and combines commits, issues, and PR events into a unified chronological stream. |

## Utilities (`scripts/utils/`)
- `github-client.js`: Authenticated REST and GraphQL clients with pagination support and rate limit detection.
- `cache.js`: File-based caching mechanism with a default 60-minute TTL to minimize GitHub API quota consumption.

## Integration Notes
- Supports both database-backed (Prisma + PostgreSQL) and file-based (`data/snapshot.json`) sync modes.
- Preserves custom user-defined project URLs (`customUrl`) while automatically populating them from the GitHub repository `homepage` when initially synced.
- Gracefully degrades to database/snapshot cache when GitHub API rate limits are encountered.
