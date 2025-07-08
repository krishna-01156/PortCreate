/*
  # Add new fields to portfolios table

  1. New Columns
    - `github_url` (text) - GitHub profile URL
    - `linkedin_url` (text) - LinkedIn profile URL  
    - `work_experience` (jsonb) - Work experience data
    - `technical_skills` (jsonb) - Technical skills for ATS resume

  2. Updates
    - Add new columns to existing portfolios table
    - Set default values for existing records
*/

-- Add new columns to portfolios table
DO $$
BEGIN
  -- Add github_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolios' AND column_name = 'github_url'
  ) THEN
    ALTER TABLE portfolios ADD COLUMN github_url text DEFAULT '';
  END IF;

  -- Add linkedin_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolios' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE portfolios ADD COLUMN linkedin_url text DEFAULT '';
  END IF;

  -- Add work_experience column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolios' AND column_name = 'work_experience'
  ) THEN
    ALTER TABLE portfolios ADD COLUMN work_experience jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add technical_skills column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolios' AND column_name = 'technical_skills'
  ) THEN
    ALTER TABLE portfolios ADD COLUMN technical_skills jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;