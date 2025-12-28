---
name: github-manager
description: Fetch and manage GitHub repositories (owner + collaborator), issues, PRs, commits, and timeline data.
---

# GitHub Manager Skill

This skill provides scripts for collecting GitHub data using a Personal Access Token (PAT).

## Required environment variables
- GITHUB_TOKEN
- GITHUB_USERNAME

## Scripts
- scripts/fetch-repos.js
- scripts/fetch-issues.js
- scripts/fetch-prs.js
- scripts/fetch-commits.js
- scripts/fetch-repo-context.js
- scripts/fetch-language-stats.js
- scripts/fetch-stats.js
- scripts/fetch-timeline.js

## Notes
- Uses REST + GraphQL APIs.
- Includes rate limit handling and simple file cache.

