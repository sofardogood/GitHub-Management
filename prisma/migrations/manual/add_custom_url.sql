-- Add customUrl column to Repo table
-- Run this in Supabase SQL Editor

ALTER TABLE "Repo" ADD COLUMN IF NOT EXISTS "customUrl" TEXT;
