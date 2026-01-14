-- =====================================================
-- TOKEN DELETION FIX - BACKEND UPDATES
-- =====================================================
-- This file contains the SQL updates needed to fix the token deletion issues
-- Run these commands in your Supabase SQL editor

-- =====================================================
-- 1. Fix delete_token function
-- =====================================================
-- This function now properly:
-- - Invalidates all active sessions for users with the deleted token
-- - Updates user records to set token_id to NULL and expiry to past date
-- - Deletes the token from the tokens table

CREATE OR REPLACE FUNCTION public.delete_token(
  p_token_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_affected_count INTEGER;
BEGIN
  -- First, invalidate all active sessions for users with this token
  -- This forces immediate logout
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id IN (
    SELECT id FROM public.users WHERE token_id = p_token_id
  ) AND is_active = true;
  
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  
  -- Remove token reference from users and set expiry to past date
  UPDATE public.users
  SET token_id = NULL,
      subscription_months = NULL,
      token_expiry_date = NOW() - INTERVAL '1 day'  -- Set to yesterday (expired, enables renewal)
  WHERE token_id = p_token_id;
  
  -- Delete the token
  DELETE FROM public.tokens WHERE id = p_token_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Token not found');
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Token deleted successfully',
    'sessions_invalidated', v_affected_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. Update validate_session function
-- =====================================================
-- This function now checks if the user's token still exists
-- If token was deleted, it returns token_deleted flag

CREATE OR REPLACE FUNCTION public.validate_session(
  p_session_token TEXT
)
RETURNS JSON AS $$
DECLARE
  v_session RECORD;
  v_user RECORD;
  v_token RECORD;
BEGIN
  -- Get session
  SELECT s.id, s.user_id, s.expires_at, s.is_active
  INTO v_session
  FROM public.user_sessions s
  WHERE s.session_token = p_session_token;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'valid', false, 'error', 'Session not found');
  END IF;
  
  IF NOT v_session.is_active THEN
    RETURN json_build_object('success', false, 'valid', false, 'error', 'Session inactive');
  END IF;
  
  IF v_session.expires_at < NOW() THEN
    -- Deactivate expired session
    UPDATE public.user_sessions SET is_active = false WHERE id = v_session.id;
    RETURN json_build_object('success', false, 'valid', false, 'error', 'Session expired');
  END IF;
  
  -- Get user
  SELECT id, token_id, token_expiry_date, is_active
  INTO v_user
  FROM public.users
  WHERE id = v_session.user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'valid', false, 'error', 'User not found');
  END IF;
  
  IF NOT v_user.is_active THEN
    RETURN json_build_object('success', false, 'valid', false, 'error', 'User inactive');
  END IF;
  
  -- **NEW: Check if user's token still exists**
  IF v_user.token_id IS NOT NULL THEN
    SELECT id, expiry_date, is_active
    INTO v_token
    FROM public.tokens
    WHERE id = v_user.token_id;
    
    IF NOT FOUND THEN
      -- Token was deleted by admin, invalidate session
      UPDATE public.user_sessions SET is_active = false WHERE id = v_session.id;
      RETURN json_build_object(
        'success', false, 
        'valid', false, 
        'token_deleted', true,
        'error', 'Your access token has been revoked'
      );
    END IF;
    
    -- Check if token is expired
    IF v_token.expiry_date < NOW() THEN
      UPDATE public.user_sessions SET is_active = false WHERE id = v_session.id;
      RETURN json_build_object(
        'success', false,
        'valid', false,
        'token_invalid', true,
        'error', 'Token has expired'
      );
    END IF;
    
    -- Check if token is inactive
    IF NOT v_token.is_active THEN
      UPDATE public.user_sessions SET is_active = false WHERE id = v_session.id;
      RETURN json_build_object(
        'success', false,
        'valid', false,
        'token_invalid', true,
        'error', 'Token is inactive'
      );
    END IF;
  END IF;
  
  -- Update last activity
  UPDATE public.user_sessions SET last_activity = NOW() WHERE id = v_session.id;
  
  RETURN json_build_object('success', true, 'valid', true, 'user_id', v_session.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the functions were updated correctly

-- Check if delete_token function exists
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'delete_token' 
  AND routine_schema = 'public';

-- Check if validate_session function exists
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'validate_session' 
  AND routine_schema = 'public';

-- =====================================================
-- TESTING QUERIES (Optional)
-- =====================================================
-- Use these to test the functionality

-- 1. Create a test token
-- SELECT * FROM generate_token(3);

-- 2. Check active sessions
-- SELECT u.username, s.session_token, s.is_active, s.expires_at
-- FROM user_sessions s
-- JOIN users u ON s.user_id = u.id
-- WHERE s.is_active = true;

-- 3. After deleting a token, verify sessions were invalidated
-- SELECT u.username, s.session_token, s.is_active
-- FROM user_sessions s
-- JOIN users u ON s.user_id = u.id
-- WHERE u.token_id IS NULL;
