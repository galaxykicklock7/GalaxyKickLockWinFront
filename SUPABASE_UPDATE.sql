-- =====================================================
-- SUPABASE UPDATE - Run this in Supabase SQL Editor
-- =====================================================
-- This file contains ALL the updates needed for:
-- 1. Token deletion with session invalidation
-- 2. User deletion with proper cleanup
-- 3. Username format fix (allow DELETED_ prefix)
-- 4. Session validation with token/user deletion detection

-- =====================================================
-- 1. UPDATE USERNAME CONSTRAINT
-- =====================================================
-- Allow DELETED_ prefix for soft-deleted users

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS username_format;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS username_length;

ALTER TABLE public.users ADD CONSTRAINT username_length 
  CHECK (char_length(username) >= 3 AND char_length(username) <= 200);

ALTER TABLE public.users ADD CONSTRAINT username_format 
  CHECK (username ~ '^([a-zA-Z0-9_-]+|DELETED_[a-zA-Z0-9_-]+_[0-9]+)$');

-- =====================================================
-- 2. UPDATE delete_user FUNCTION
-- =====================================================
-- Properly invalidates sessions, DELETES token, soft deletes user

CREATE OR REPLACE FUNCTION public.delete_user(
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_username TEXT;
  v_token_id UUID;
  v_sessions_count INTEGER;
BEGIN
  -- Get user details before deletion
  SELECT username, token_id INTO v_username, v_token_id
  FROM public.users
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Step 1: Invalidate all active sessions (force logout)
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;
  
  GET DIAGNOSTICS v_sessions_count = ROW_COUNT;
  
  -- Step 2: Delete the token (not just unlink)
  IF v_token_id IS NOT NULL THEN
    -- First remove token reference from user
    UPDATE public.users
    SET token_id = NULL,
        subscription_months = NULL,
        token_expiry_date = NOW() - INTERVAL '1 day'
    WHERE id = p_user_id;
    
    -- Then delete the token completely
    DELETE FROM public.tokens WHERE id = v_token_id;
  END IF;
  
  -- Step 3: Mark user as deleted (soft delete to prevent username reuse)
  UPDATE public.users
  SET is_active = false,
      username = 'DELETED_' || username || '_' || extract(epoch from now())::bigint::text,
      password_hash = 'DELETED'
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'User and token deleted successfully',
    'username', v_username,
    'sessions_invalidated', v_sessions_count,
    'token_deleted', v_token_id IS NOT NULL
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. UPDATE delete_token FUNCTION
-- =====================================================
-- Already correct in supabase_setup.sql, but included here for completeness

CREATE OR REPLACE FUNCTION public.delete_token(
  p_token_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_affected_count INTEGER;
BEGIN
  -- First, invalidate all active sessions for users with this token
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id IN (
    SELECT id FROM public.users WHERE token_id = p_token_id
  ) AND is_active = true;
  
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  
  -- Remove token reference from users
  UPDATE public.users
  SET token_id = NULL,
      subscription_months = NULL,
      token_expiry_date = NOW() - INTERVAL '1 day'
  WHERE token_id = p_token_id;
  
  -- Delete token
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
-- 4. UPDATE validate_session FUNCTION
-- =====================================================
-- Detects token deletion and user deletion

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
  
  -- Check if user was deleted by admin
  IF NOT v_user.is_active THEN
    UPDATE public.user_sessions SET is_active = false WHERE id = v_session.id;
    RETURN json_build_object(
      'success', false, 
      'valid', false, 
      'user_deleted', true,
      'reason', 'Your account has been removed by admin',
      'error', 'User account deleted'
    );
  END IF;
  
  -- Check if user's token still exists
  IF v_user.token_id IS NOT NULL THEN
    SELECT id, expiry_date, is_active
    INTO v_token
    FROM public.tokens
    WHERE id = v_user.token_id;
    
    IF NOT FOUND THEN
      UPDATE public.user_sessions SET is_active = false WHERE id = v_session.id;
      RETURN json_build_object(
        'success', false, 
        'valid', false, 
        'token_deleted', true,
        'reason', 'Your access has been revoked by admin',
        'error', 'Token deleted'
      );
    END IF;
    
    IF v_token.expiry_date < NOW() THEN
      UPDATE public.user_sessions SET is_active = false WHERE id = v_session.id;
      RETURN json_build_object(
        'success', false,
        'valid', false,
        'token_invalid', true,
        'error', 'Token expired'
      );
    END IF;
    
    IF NOT v_token.is_active THEN
      UPDATE public.user_sessions SET is_active = false WHERE id = v_session.id;
      RETURN json_build_object(
        'success', false,
        'valid', false,
        'token_invalid', true,
        'error', 'Token inactive'
      );
    END IF;
  END IF;
  
  -- Update last activity
  UPDATE public.user_sessions SET last_activity = NOW() WHERE id = v_session.id;
  
  RETURN json_build_object('success', true, 'valid', true, 'user_id', v_session.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. UPDATE authenticate_user FUNCTION
-- =====================================================
-- Check for deleted users

CREATE OR REPLACE FUNCTION public.authenticate_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_session_token TEXT;
  v_session_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT id, username, password_hash, token_id, subscription_months, token_expiry_date, is_active
  INTO v_user
  FROM public.users
  WHERE username = p_username;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password');
  END IF;
  
  -- Check if user was deleted by admin
  IF NOT v_user.is_active THEN
    RETURN json_build_object('success', false, 'error', 'This account has been removed by admin. Please contact support.');
  END IF;
  
  IF v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password');
  END IF;
  
  IF v_user.token_expiry_date IS NOT NULL AND v_user.token_expiry_date < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Your subscription has expired. Please contact admin.');
  END IF;
  
  -- Invalidate all previous sessions
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = v_user.id AND is_active = true;
  
  -- Generate session token
  v_session_token := encode(
    digest(v_user.id::text || extract(epoch from now())::text || gen_random_bytes(16)::text, 'sha256'),
    'hex'
  );
  
  v_expires_at := NOW() + INTERVAL '24 hours';
  
  INSERT INTO public.user_sessions (user_id, session_token, expires_at)
  VALUES (v_user.id, v_session_token, v_expires_at)
  RETURNING id INTO v_session_id;
  
  UPDATE public.users SET last_login = NOW() WHERE id = v_user.id;
  
  RETURN json_build_object(
    'success', true,
    'user_id', v_user.id,
    'username', v_user.username,
    'subscription_months', v_user.subscription_months,
    'token_expiry_date', v_user.token_expiry_date,
    'session_token', v_session_token,
    'session_id', v_session_id,
    'expires_at', v_expires_at
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Authentication failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. UPDATE register_user FUNCTION
-- =====================================================
-- Prevent reuse of deleted usernames

CREATE OR REPLACE FUNCTION public.register_user(
  p_username TEXT,
  p_password TEXT,
  p_token_value TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_password_hash TEXT;
  v_token RECORD;
  v_existing_user RECORD;
BEGIN
  IF char_length(p_username) < 3 OR char_length(p_username) > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Username must be between 3 and 50 characters');
  END IF;
  
  IF char_length(p_password) < 8 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 8 characters');
  END IF;
  
  -- Check if username exists (including deleted users)
  SELECT id, is_active INTO v_existing_user
  FROM public.users
  WHERE username = p_username;
  
  IF FOUND THEN
    IF v_existing_user.is_active THEN
      RETURN json_build_object('success', false, 'error', 'Username already exists');
    ELSE
      RETURN json_build_object('success', false, 'error', 'This username was previously used and cannot be registered again. Please choose a different username.');
    END IF;
  END IF;
  
  -- Validate token
  SELECT id, duration_months, expiry_date, is_active
  INTO v_token
  FROM public.tokens
  WHERE token_value = p_token_value;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token');
  END IF;
  
  IF NOT v_token.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Token is inactive');
  END IF;
  
  IF v_token.expiry_date < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Token has expired');
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.users WHERE token_id = v_token.id AND is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Token has already been used');
  END IF;
  
  v_password_hash := crypt(p_password, gen_salt('bf', 10));
  
  INSERT INTO public.users (username, password_hash, token_id, subscription_months, token_expiry_date)
  VALUES (p_username, v_password_hash, v_token.id, v_token.duration_months, v_token.expiry_date)
  RETURNING id INTO v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'username', p_username,
    'subscription_months', v_token.duration_months,
    'token_expiry_date', v_token.expiry_date
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'All functions updated successfully!' AS status;

-- Check constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
  AND conname IN ('username_format', 'username_length');

