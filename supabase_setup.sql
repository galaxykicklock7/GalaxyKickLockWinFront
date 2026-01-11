-- =====================================================
-- GALAXY KICK LOCK 2.0 - SECURE USER AUTHENTICATION
-- =====================================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tokens CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.register_user(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.authenticate_user(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.validate_session(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.logout_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.logout_all_sessions(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.register_admin(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.authenticate_admin(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.generate_token(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_all_users() CASCADE;
DROP FUNCTION IF EXISTS public.get_tokens_by_duration(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.renew_user_token(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.delete_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_token(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create tokens table for subscription management
CREATE TABLE IF NOT EXISTS public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_value TEXT UNIQUE NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months IN (3, 6, 12)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_duration CHECK (duration_months IN (3, 6, 12))
);

-- Create admins table for admin authentication
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT admin_username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
  CONSTRAINT admin_username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Create users table with security best practices
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  token_id UUID REFERENCES public.tokens(id) ON DELETE SET NULL,
  subscription_months INTEGER,
  token_expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  user_agent TEXT,
  ip_address TEXT
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_token_id ON public.users(token_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_tokens_token_value ON public.tokens(token_value);
CREATE INDEX IF NOT EXISTS idx_tokens_is_active ON public.tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow public user registration"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Admins table policies (admins can manage everything)
CREATE POLICY "Admins can view all data"
  ON public.admins
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin registration"
  ON public.admins
  FOR INSERT
  WITH CHECK (true);

-- Tokens table policies
CREATE POLICY "Tokens viewable by all"
  ON public.tokens
  FOR SELECT
  USING (true);

CREATE POLICY "Tokens manageable by admins"
  ON public.tokens
  FOR ALL
  USING (true);

-- User sessions policies
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
  ON public.user_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- SECURE AUTHENTICATION FUNCTIONS
-- =====================================================

-- Function: Register new admin
CREATE OR REPLACE FUNCTION public.register_admin(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_admin_id UUID;
  v_password_hash TEXT;
BEGIN
  IF char_length(p_username) < 3 OR char_length(p_username) > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Username must be between 3 and 50 characters');
  END IF;
  
  IF char_length(p_password) < 8 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 8 characters');
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.admins WHERE username = p_username) THEN
    RETURN json_build_object('success', false, 'error', 'Admin username already exists');
  END IF;
  
  v_password_hash := crypt(p_password, gen_salt('bf', 10));
  
  INSERT INTO public.admins (username, password_hash)
  VALUES (p_username, v_password_hash)
  RETURNING id INTO v_admin_id;
  
  RETURN json_build_object(
    'success', true,
    'admin_id', v_admin_id,
    'username', p_username
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Authenticate admin
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
  v_session_token TEXT;
BEGIN
  SELECT id, username, password_hash, is_active
  INTO v_admin
  FROM public.admins
  WHERE username = p_username;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password');
  END IF;
  
  IF NOT v_admin.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Admin account is disabled');
  END IF;
  
  IF v_admin.password_hash != crypt(p_password, v_admin.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password');
  END IF;
  
  v_session_token := encode(
    digest(v_admin.id::text || extract(epoch from now())::text, 'sha256'),
    'hex'
  );
  
  UPDATE public.admins
  SET last_login = NOW()
  WHERE id = v_admin.id;
  
  RETURN json_build_object(
    'success', true,
    'admin_id', v_admin.id,
    'username', v_admin.username,
    'session_token', v_session_token
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Authentication failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Generate token
CREATE OR REPLACE FUNCTION public.generate_token(
  p_duration_months INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_token_id UUID;
  v_token_value TEXT;
  v_expiry_date TIMESTAMPTZ;
BEGIN
  IF p_duration_months NOT IN (3, 6, 12) THEN
    RETURN json_build_object('success', false, 'error', 'Duration must be 3, 6, or 12 months');
  END IF;
  
  -- Generate unique token value
  v_token_value := encode(gen_random_bytes(32), 'hex');
  v_expiry_date := NOW() + (p_duration_months || ' months')::INTERVAL;
  
  INSERT INTO public.tokens (token_value, duration_months, expiry_date)
  VALUES (v_token_value, p_duration_months, v_expiry_date)
  RETURNING id INTO v_token_id;
  
  RETURN json_build_object(
    'success', true,
    'token_id', v_token_id,
    'token_value', v_token_value,
    'duration_months', p_duration_months,
    'expiry_date', v_expiry_date
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get all users with token details
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(user_data)
  INTO v_result
  FROM (
    SELECT json_build_object(
      'id', u.id,
      'username', u.username,
      'subscription_months', u.subscription_months,
      'token_expiry_date', u.token_expiry_date,
      'token_id', u.token_id,
      'token_value', t.token_value,
      'is_active', u.is_active,
      'created_at', u.created_at,
      'last_login', u.last_login
    ) as user_data
    FROM public.users u
    LEFT JOIN public.tokens t ON u.token_id = t.id
    ORDER BY u.created_at DESC
  ) subquery;
  
  RETURN json_build_object('success', true, 'users', COALESCE(v_result, '[]'::json));
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get all tokens by duration
CREATE OR REPLACE FUNCTION public.get_tokens_by_duration(
  p_duration_months INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(token_data)
  INTO v_result
  FROM (
    SELECT json_build_object(
      'id', t.id,
      'token_value', t.token_value,
      'duration_months', t.duration_months,
      'created_at', t.created_at,
      'expiry_date', t.expiry_date,
      'is_active', t.is_active,
      'is_used', EXISTS(SELECT 1 FROM public.users u WHERE u.token_id = t.id)
    ) as token_data
    FROM public.tokens t
    WHERE t.duration_months = p_duration_months
    ORDER BY t.created_at DESC
  ) subquery;
  
  RETURN json_build_object('success', true, 'tokens', COALESCE(v_result, '[]'::json));
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Renew user token
CREATE OR REPLACE FUNCTION public.renew_user_token(
  p_user_id UUID,
  p_duration_months INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_token_id UUID;
  v_token_value TEXT;
  v_expiry_date TIMESTAMPTZ;
BEGIN
  IF p_duration_months NOT IN (3, 6, 12) THEN
    RETURN json_build_object('success', false, 'error', 'Duration must be 3, 6, or 12 months');
  END IF;
  
  -- Generate new token
  v_token_value := encode(gen_random_bytes(32), 'hex');
  v_expiry_date := NOW() + (p_duration_months || ' months')::INTERVAL;
  
  INSERT INTO public.tokens (token_value, duration_months, expiry_date)
  VALUES (v_token_value, p_duration_months, v_expiry_date)
  RETURNING id INTO v_token_id;
  
  -- Update user with new token
  UPDATE public.users
  SET token_id = v_token_id,
      subscription_months = p_duration_months,
      token_expiry_date = v_expiry_date
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'token_value', v_token_value,
    'expiry_date', v_expiry_date
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete user
CREATE OR REPLACE FUNCTION public.delete_user(
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  DELETE FROM public.users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'User deleted successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete token
CREATE OR REPLACE FUNCTION public.delete_token(
  p_token_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Remove token reference from users
  UPDATE public.users
  SET token_id = NULL,
      subscription_months = NULL,
      token_expiry_date = NULL
  WHERE token_id = p_token_id;
  
  -- Delete token
  DELETE FROM public.tokens WHERE id = p_token_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Token not found');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Token deleted successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Register new user (with token validation)
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
BEGIN
  IF char_length(p_username) < 3 OR char_length(p_username) > 50 THEN
    RETURN json_build_object('success', false, 'error', 'Username must be between 3 and 50 characters');
  END IF;
  
  IF char_length(p_password) < 8 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 8 characters');
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.users WHERE username = p_username) THEN
    RETURN json_build_object('success', false, 'error', 'Username already exists');
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
  
  -- Check if token is already used
  IF EXISTS (SELECT 1 FROM public.users WHERE token_id = v_token.id) THEN
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

-- Function: Authenticate user (login)
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
  
  IF NOT v_user.is_active THEN
    RETURN json_build_object('success', false, 'error', 'Account is disabled');
  END IF;
  
  IF v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password');
  END IF;
  
  -- Check if token has expired
  IF v_user.token_expiry_date IS NOT NULL AND v_user.token_expiry_date < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Your subscription has expired. Please contact admin.');
  END IF;
  
  -- SINGLE SESSION ENFORCEMENT: Invalidate all previous sessions for this user
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = v_user.id AND is_active = true;
  
  -- Generate session token
  v_session_token := encode(
    digest(v_user.id::text || extract(epoch from now())::text || gen_random_bytes(16)::text, 'sha256'),
    'hex'
  );
  
  -- Session expires in 24 hours
  v_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Create session record
  INSERT INTO public.user_sessions (user_id, session_token, expires_at)
  VALUES (v_user.id, v_session_token, v_expires_at)
  RETURNING id INTO v_session_id;
  
  -- Update last login
  UPDATE public.users
  SET last_login = NOW()
  WHERE id = v_user.id;
  
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

-- Function: Validate session token
CREATE OR REPLACE FUNCTION public.validate_session(
  p_session_token TEXT
)
RETURNS JSON AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT s.id, s.user_id, s.expires_at, s.is_active, u.is_active as user_active
  INTO v_session
  FROM public.user_sessions s
  JOIN public.users u ON s.user_id = u.id
  WHERE s.session_token = p_session_token;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'valid', false, 'error', 'Session not found');
  END IF;
  
  IF NOT v_session.is_active OR NOT v_session.user_active THEN
    RETURN json_build_object('success', false, 'valid', false, 'error', 'Session inactive');
  END IF;
  
  IF v_session.expires_at < NOW() THEN
    -- Deactivate expired session
    UPDATE public.user_sessions SET is_active = false WHERE id = v_session.id;
    RETURN json_build_object('success', false, 'valid', false, 'error', 'Session expired');
  END IF;
  
  -- Update last activity
  UPDATE public.user_sessions SET last_activity = NOW() WHERE id = v_session.id;
  
  RETURN json_build_object('success', true, 'valid', true, 'user_id', v_session.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Logout current session
CREATE OR REPLACE FUNCTION public.logout_user(
  p_session_token TEXT
)
RETURNS JSON AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false
  WHERE session_token = p_session_token;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Session not found');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Logged out successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Logout all sessions for a user
CREATE OR REPLACE FUNCTION public.logout_all_sessions(
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'All sessions logged out', 
    'sessions_closed', v_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE PGCRYPTO EXTENSION (for password hashing)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.register_user(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_user(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.logout_user(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.logout_all_sessions(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_admin(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_admin(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_token(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tokens_by_duration(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.renew_user_token(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_token(UUID) TO anon, authenticated;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Verify setup
SELECT 'Tokens table created successfully' AS status;
SELECT 'Admins table created successfully' AS status;
SELECT 'Users table created successfully' AS status;
SELECT 'RLS policies enabled' AS status;
SELECT 'Authentication functions created' AS status;
SELECT 'Admin management functions created' AS status;
SELECT 'Token management functions created' AS status;
