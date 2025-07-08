/*
  # Fix Authentication and Profiles Table Issues

  1. Database Structure Fixes
    - Drop and recreate the profiles table with correct foreign key reference to auth.users
    - Ensure proper column defaults and constraints
    
  2. Security Updates  
    - Update RLS policies to use auth.uid() function correctly
    - Ensure policies allow proper CRUD operations for authenticated users
    
  3. Trigger Function Updates
    - Update handle_new_user function to properly extract user metadata
    - Ensure trigger is properly configured for auth.users table
    
  4. Data Migration
    - Preserve any existing profile data during table recreation
*/

-- First, backup any existing profile data
CREATE TEMP TABLE profiles_backup AS 
SELECT * FROM public.profiles;

-- Drop existing foreign key constraint and recreate table structure
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create the profiles table with correct structure
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  resume_text text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Restore any existing profile data (matching by email if possible)
INSERT INTO public.profiles (id, full_name, email, resume_text, created_at, updated_at)
SELECT 
  pb.id,
  pb.full_name,
  pb.email,
  pb.resume_text,
  pb.created_at,
  pb.updated_at
FROM profiles_backup pb
WHERE EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = pb.id
)
ON CONFLICT (id) DO NOTHING;

-- Clean up temp table
DROP TABLE profiles_backup;