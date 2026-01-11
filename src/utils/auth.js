import { supabase } from './supabase';

/**
 * Register a new user
 * @param {string} username - Username (3-50 characters, alphanumeric, underscore, hyphen)
 * @param {string} password - Password (minimum 8 characters)
 * @param {string} confirmPassword - Password confirmation
 * @param {string} token - User token
 * @returns {Promise<{success: boolean, error?: string, data?: object}>}
 */
export const registerUser = async (username, password, confirmPassword, token) => {
  try {
    // Client-side validation
    if (!username || !password || !confirmPassword || !token) {
      const missing = [];
      if (!username) missing.push('username');
      if (!password) missing.push('password');
      if (!confirmPassword) missing.push('confirmPassword');
      if (!token) missing.push('token');
      return { success: false, error: `Missing fields: ${missing.join(', ')}` };
    }

    if (username.length < 3 || username.length > 50) {
      return { success: false, error: 'Username must be between 3 and 50 characters' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { success: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }

    // Call Supabase function to register user
    const { data, error } = await supabase.rpc('register_user', {
      p_username: username,
      p_password: password,
      p_token_value: token,
    });

    if (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }

    if (!data.success) {
      return { success: false, error: data.error || 'Registration failed' };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Registration exception:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Authenticate user (login)
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<{success: boolean, error?: string, data?: object}>}
 */
export const loginUser = async (username, password) => {
  try {
    // Client-side validation
    if (!username || !password) {
      return { success: false, error: 'Username and password are required' };
    }

    // Call Supabase function to authenticate user
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: username,
      p_password: password,
    });

    if (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Invalid username or password' };
    }

    if (!data.success) {
      return { success: false, error: data.error || 'Login failed' };
    }

    // Store session in localStorage
    const session = {
      user_id: data.user_id,
      username: data.username,
      subscription_months: data.subscription_months,
      token_expiry_date: data.token_expiry_date,
      session_token: data.session_token,
      session_id: data.session_id,
      expires_at: data.expires_at,
      login_time: new Date().toISOString(),
    };

    localStorage.setItem('galaxyKickLockSession', JSON.stringify(session));

    return { success: true, data: session };
  } catch (err) {
    console.error('Login exception:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Logout user (invalidates current session)
 */
export const logoutUser = async () => {
  try {
    const session = getSession();
    if (session && session.session_token) {
      // Call backend to invalidate session
      await supabase.rpc('logout_user', {
        p_session_token: session.session_token
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem('galaxyKickLockSession');
    localStorage.removeItem('galaxyKickLockConfig');
  }
};

/**
 * Logout from all sessions (all devices)
 */
export const logoutAllSessions = async () => {
  try {
    const session = getSession();
    if (session && session.user_id) {
      const { data, error } = await supabase.rpc('logout_all_sessions', {
        p_user_id: session.user_id
      });

      if (error) throw error;

      // Clear local storage
      localStorage.removeItem('galaxyKickLockSession');
      localStorage.removeItem('galaxyKickLockConfig');

      return { success: true, data };
    }
    return { success: false, error: 'No active session' };
  } catch (error) {
    console.error('Logout all sessions error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current session
 * @returns {object|null} Session object or null if not logged in
 */
export const getSession = () => {
  try {
    const sessionStr = localStorage.getItem('galaxyKickLockSession');
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);

    // Check if session is expired (24 hours)
    const loginTime = new Date(session.login_time);
    const now = new Date();
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

    if (hoursSinceLogin > 24) {
      logoutUser();
      return null;
    }

    return session;
  } catch (err) {
    console.error('Error getting session:', err);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return getSession() !== null;
};

/**
 * Validate session with backend
 * @returns {Promise<boolean>}
 */
export const validateSession = async () => {
  try {
    const session = getSession();
    if (!session) return false;

    const { data, error } = await supabase.rpc('validate_session', {
      p_username: session.username,
      p_session_token: session.session_token,
    });

    if (error || !data) {
      logoutUser();
      return false;
    }

    return data;
  } catch (err) {
    console.error('Session validation error:', err);
    logoutUser();
    return false;
  }
};
