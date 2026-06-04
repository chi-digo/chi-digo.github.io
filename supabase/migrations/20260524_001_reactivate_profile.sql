-- Automatically reactivate a soft-deleted profile when the user signs in again.
-- Fires on every new auth session; only updates rows where deleted_at IS NOT NULL.

CREATE OR REPLACE FUNCTION public.reactivate_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET deleted_at = NULL
  WHERE id = NEW.user_id
    AND deleted_at IS NOT NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_session_reactivate_profile ON auth.sessions;

CREATE TRIGGER on_session_reactivate_profile
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.reactivate_profile();
