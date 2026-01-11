import { supabase } from './supabase';

// Admin Registration
export async function registerAdmin(username, password) {
  try {
    const { data, error } = await supabase.rpc('register_admin', {
      p_username: username,
      p_password: password
    });

    if (error) throw error;

    if (data.success) {
      return { success: true, data: data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Admin registration error:', error);
    return { success: false, error: error.message };
  }
}

// Admin Login
export async function loginAdmin(username, password) {
  try {
    const { data, error } = await supabase.rpc('authenticate_admin', {
      p_username: username,
      p_password: password
    });

    if (error) throw error;

    if (data.success) {
      // Store admin session in localStorage
      const adminSession = {
        admin_id: data.admin_id,
        username: data.username,
        session_token: data.session_token,
        login_time: new Date().toISOString()
      };
      localStorage.setItem('adminSession', JSON.stringify(adminSession));
      return { success: true, data: adminSession };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: error.message };
  }
}

// Admin Logout
export function logoutAdmin() {
  localStorage.removeItem('adminSession');
}

// Get Admin Session
export function getAdminSession() {
  const sessionStr = localStorage.getItem('adminSession');
  if (!sessionStr) return null;

  try {
    const session = JSON.parse(sessionStr);
    
    // Check if session is expired (24 hours)
    const loginTime = new Date(session.login_time);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      logoutAdmin();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error parsing admin session:', error);
    return null;
  }
}

// Check if Admin is Authenticated
export function isAdminAuthenticated() {
  return getAdminSession() !== null;
}
