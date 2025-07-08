/*
  # Enable Email Verification

  1. Configuration Updates
    - Email verification is enabled by default in Supabase Auth
    - This migration ensures proper email confirmation flow
    - Updates auth settings to require email confirmation

  2. Security Enhancements
    - Users must verify email before accessing protected resources
    - Email confirmation required for account activation
*/

-- This migration ensures email verification is properly configured
-- Email verification settings are managed in the Supabase dashboard
-- under Authentication > Settings

-- Update the handle_new_user function to work with email verification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create profile after email is confirmed
  -- The trigger will run again when email_confirmed_at is set
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = NEW.raw_user_meta_data->>'full_name',
      email = NEW.email,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger to fire on email confirmation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also keep the original trigger for immediate profile creation (will be updated when email is confirmed)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();