/*
  # Add job_type column to career_recommendations table

  1. Changes
    - Add job_type column to career_recommendations table
    - Set default value to 'full-time' for existing records
    - Add index for better query performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add job_type column to career_recommendations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'career_recommendations' AND column_name = 'job_type'
  ) THEN
    ALTER TABLE career_recommendations ADD COLUMN job_type text DEFAULT 'full-time';
  END IF;
END $$;

-- Add check constraint to ensure valid job types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'career_recommendations_job_type_check'
  ) THEN
    ALTER TABLE career_recommendations 
    ADD CONSTRAINT career_recommendations_job_type_check 
    CHECK (job_type IN ('full-time', 'internship'));
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_career_recommendations_job_type 
ON career_recommendations(user_id, job_type);