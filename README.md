# GitHub Management System

This workspace contains:
- `agentskills/skills/github-manager`: Agent Skills scripts to fetch GitHub data.
- `github-dashboard`: Next.js app (UI + API routes) for dashboard, list, kanban, and timeline views.
- `github-api`: Legacy Express API (no longer required for Vercel). Use the Next.js API routes instead.

## Setup (Next.js)

1) Create `github-dashboard/.env.local`:

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your-username
DATABASE_URL=postgresql://user:password@localhost:5432/github_management?schema=public
NEXT_PUBLIC_AUTO_SYNC=true
NEXT_PUBLIC_AUTO_SYNC_INTERVAL_MINUTES=10
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3-flash-preview
```

2) Install dependencies:

```
cd github-dashboard
npm install
```

3) Run the app:

```
npm run dev
```

Open `http://localhost:3000`.

## Vercel deploy
- Deploy the `github-dashboard` directory as a Next.js project.
- Set environment variables in Vercel:
  - `GITHUB_TOKEN`
  - `GITHUB_USERNAME`
  - `DATABASE_URL` (optional, enables stored analytics and sync)
  - `GEMINI_API_KEY` (optional, enables semantic search)
  - `GEMINI_MODEL` (optional, defaults to gemini-3-flash-preview)

## Notes
- `GITHUB_TOKEN` needs `repo`, `read:org`, and `read:user` scopes for private data.
- Caching is stored under `agentskills/skills/github-manager/.cache` (ephemeral on serverless).
- Semantic search uses Gemini when `GEMINI_API_KEY` is set. Without it, keyword-based search is used.
- If `DATABASE_URL` is set, API routes will read from the database when available. Use `POST /api/sync` to refresh.
- If `DATABASE_URL` is not set, `POST /api/sync` writes a local snapshot to `github-dashboard/data/snapshot.json`.
