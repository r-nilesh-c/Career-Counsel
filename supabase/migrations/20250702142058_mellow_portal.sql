/*
  # Fix Email Verification Configuration

  1. Database Fixes
    - Update trigger function to handle email verification properly
    - Ensure profiles are created correctly after email confirmation
    
  2. RLS Policy Updates
    - Allow profile creation for verified users
    - Handle edge cases in authentication flow
*/

-- Drop existing triggers to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Handle both immediate profile creation and email confirmation
  IF TG_OP = 'INSERT' THEN
    -- Create profile immediately on signup (even before email confirmation)
    INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Update profile when email is confirmed
    UPDATE public.profiles 
    SET 
      email = NEW.email,
      updated_at = now()
    WHERE id = NEW.id;
    
    -- Create profile if it doesn't exist (fallback)
    INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for both user creation and email confirmation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to be more permissive for profile creation
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;

CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow upsert operations for profile management
CREATE POLICY "Users can upsert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);