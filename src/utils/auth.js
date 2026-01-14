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
      if (!confirmPassword) missing.push('password confirmation');
      if (!token) missing.push('access token');
      return { success: false, error: `Please provide: ${missing.join(', ')}` };
    }

    const trimmedUsername = username.trim();
    const trimmedToken = token.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      return { success: false, error: 'Username must be between 3 and 50 characters' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
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
      p_username: trimmedUsername,
      p_password: password,
      p_token_value: trimmedToken,
    });

    if (error) {
      console.error('Registration error:', error);

      // Provide user-friendly error messages
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        return { success: false, error: 'Username already taken. Please choose another.' };
      }
      if (error.message.includes('token')) {
        return { success: false, error: 'Invalid or expired access token' };
      }

      return { success: false, error: 'Registration failed. Please try again.' };
    }

    if (!data.success) {
      // Handle specific error messages from the database function
      const errorMsg = data.error || 'Registration failed';

      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        return { success: false, error: 'Username already taken. Please choose another.' };
      }
      if (errorMsg.includes('token') && errorMsg.includes('not found')) {
        return { success: false, error: 'Invalid access token. Please check and try again.' };
      }
      if (errorMsg.includes('token') && errorMsg.includes('used')) {
        return { success: false, error: 'This access token has already been used' };
      }
      if (errorMsg.includes('expired')) {
        return { success: false, error: 'Access token has expired' };
      }

      return { success: false, error: errorMsg };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Registration exception:', err);

    if (err.message.includes('fetch') || err.message.includes('network')) {
      return { success: false, error: 'Unable to connect to server. Please check your internet connection.' };
    }

    return { success: false, error: 'An unexpected error occurred. Please try again.' };
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
      return { success: false, error: 'Please enter both username and password' };
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }

    // Call Supabase function to authenticate user
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: trimmedUsername,
      p_password: password,
    });

    if (error) {
      console.error('Login error:', error);

      // Don't reveal specific details for security
      return { success: false, error: 'Invalid username or password' };
    }

    if (!data || !data.success) {
      const errorMsg = data?.error || 'Login failed';

      // Provide user-friendly messages without revealing too much
      if (errorMsg.includes('not found') || errorMsg.includes('invalid')) {
        return { success: false, error: 'Invalid username or password' };
      }
      if (errorMsg.includes('expired')) {
        return { success: false, error: 'Your subscription has expired. Please contact support.' };
      }
      if (errorMsg.includes('inactive')) {
        return { success: false, error: 'Account is inactive. Please contact support.' };
      }

      return { success: false, error: 'Login failed. Please try again.' };
    }

    // Validate required session data
    if (!data.user_id || !data.username || !data.session_token) {
      console.error('Invalid session data received');
      return { success: false, error: 'Login failed. Invalid session data.' };
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

    if (err.message.includes('fetch') || err.message.includes('network')) {
      return { success: false, error: 'Unable to connect to server. Please check your internet connection.' };
    }

    return { success: false, error: 'An unexpected error occurred. Please try again.' };
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

    // Validate session structure
    if (!session.user_id || !session.username || !session.session_token) {
      console.warn('Invalid session structure, clearing session');
      logoutUser();
      return null;
    }

    // Check if session is expired (24 hours)
    const loginTime = new Date(session.login_time);
    const now = new Date();
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

    if (hoursSinceLogin > 24) {
      console.warn('Session expired (24 hours), logging out');
      logoutUser();
      return null;
    }

    // Check token expiry date if available
    if (session.token_expiry_date) {
      const expiryDate = new Date(session.token_expiry_date);
      if (now > expiryDate) {
        console.warn('Token expired, logging out');
        logoutUser();
        return null;
      }
    }

    return session;
  } catch (err) {
    console.error('Error getting session:', err);
    logoutUser();
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
 * @returns {Promise<{valid: boolean, reason?: string, error?: string}>}
 */
export const validateSessionWithBackend = async () => {
  try {
    const session = getSession();
    if (!session || !session.session_token) {
      return { valid: false, reason: 'Session expired' };
    }

    const { data, error } = await supabase.rpc('validate_session', {
      p_session_token: session.session_token
    });

    if (error) {
      console.error('Session validation error:', error);
      logoutUser();
      return { valid: false, reason: 'Session expired' };
    }

    if (!data || !data.valid) {
      // Session is invalid, clear local storage
      console.warn('Session validation failed:', data?.error || 'Session invalid');
      logoutUser();
      
      // Check if it's a token revocation
      if (data?.error && (data.error.includes('revoked') || data.error.includes('deleted'))) {
        return { valid: false, reason: 'Your access has been revoked by admin' };
      }
      
      return { valid: false, reason: 'Session expired' };
    }

    // Additional check: verify the user's token still exists and is valid
    // This catches cases where an admin deleted the token
    if (data.token_deleted || data.token_invalid) {
      console.warn('Token has been deleted or invalidated by admin');
      logoutUser();
      return { valid: false, reason: 'Your access has been revoked by admin' };
    }

    return { valid: true };
  } catch (err) {
    console.error('Session validation exception:', err);
    logoutUser();
    return { valid: false, reason: 'Session expired' };
  }
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
