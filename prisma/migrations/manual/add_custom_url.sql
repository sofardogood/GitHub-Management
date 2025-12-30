-- Migration: Change Int to BigInt for GitHub IDs
-- Run this in Supabase SQL Editor BEFORE syncing

-- Add customUrl column if not exists
ALTER TABLE "Repo" ADD COLUMN IF NOT EXISTS "customUrl" TEXT;

-- Change Repo.id from INT to BIGINT
ALTER TABLE "Repo" ALTER COLUMN "id" TYPE BIGINT;

-- Change Issue.id and Issue.repoId from INT to BIGINT
ALTER TABLE "Issue" ALTER COLUMN "id" TYPE BIGINT;
ALTER TABLE "Issue" ALTER COLUMN "repoId" TYPE BIGINT;

-- Change PullRequest.id and PullRequest.repoId from INT to BIGINT
ALTER TABLE "PullRequest" ALTER COLUMN "id" TYPE BIGINT;
ALTER TABLE "PullRequest" ALTER COLUMN "repoId" TYPE BIGINT;

-- Change Commit.repoId from INT to BIGINT
ALTER TABLE "Commit" ALTER COLUMN "repoId" TYPE BIGINT;

-- Change TimelineEvent.repoId from INT to BIGINT
ALTER TABLE "TimelineEvent" ALTER COLUMN "repoId" TYPE BIGINT;

-- Change RepoDependency.repoId from INT to BIGINT
ALTER TABLE "RepoDependency" ALTER COLUMN "repoId" TYPE BIGINT;

-- Change RepoTag.repoId from INT to BIGINT
ALTER TABLE "RepoTag" ALTER COLUMN "repoId" TYPE BIGINT;
