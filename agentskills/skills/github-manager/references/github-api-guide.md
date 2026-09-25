# GitHub API Quick Guide

## Base URLs
- REST API: `https://api.github.com`
- GraphQL API: `https://api.github.com/graphql`

## Authentication
```http
Authorization: Bearer $GITHUB_TOKEN
X-GitHub-Api-Version: 2022-11-28
```

## Primary REST Endpoints Used

### 1. Repositories
- **`GET /user/repos?per_page=100&affiliation=owner,collaborator,organization_member&sort=updated&direction=desc`**
  - Fetches repositories accessible to the authenticated user.
  - Extracts `homepage` for automatic project deployment URL detection.
- **`GET /repos/{owner}/{repo}/readme`**
  - Fetches the raw or decoded README content (`Accept: application/vnd.github.raw`).
  - Used by the AI Summarization service (`/api/summary`) for generating concise repository summaries with Google Gemini.

### 2. Issues & Pull Requests
- **`GET /repos/{owner}/{repo}/issues?state=all&per_page=100`**
  - Fetches issues (includes issue author, assignee, labels, timestamps).
- **`GET /repos/{owner}/{repo}/pulls?state=all&per_page=100`**
  - Fetches pull requests (includes draft/merged/closed state).

### 3. Commits & Contents
- **`GET /repos/{owner}/{repo}/commits?per_page=30`**
  - Fetches recent commit history for activity tracking and staleness detection.
- **`GET /repos/{owner}/{repo}/contents/{path}`**
  - Used for inspecting dependency manifests (`package.json`, `requirements.txt`, etc.).

## GraphQL Usage
- Repository language breakdown: Fetches exact byte-level language usage across all owned repositories in a single request.
- Batch pagination over large repository collections.

## Rate Limits & Caching
- Authenticated requests have a limit of 5,000 requests per hour.
- Local file cache with a 60-minute TTL (`agentskills/.../utils/cache.js`) prevents redundant requests.
- Automatic fallback: In case of rate limit (HTTP 403 / "rate limit exceeded"), the application falls back seamlessly to data cached in PostgreSQL (Prisma) or `snapshot.json`.
