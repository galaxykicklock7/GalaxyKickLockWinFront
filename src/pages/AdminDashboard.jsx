import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminSession, logoutAdmin } from '../utils/adminAuth';
import TokenGenerator from '../components/TokenGenerator';
import UserManagement from '../components/UserManagement';
import './AdminDashboard.css';

function AdminDashboard() {
  const [adminSession, setAdminSession] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      navigate('/admin');
    } else {
      setAdminSession(session);
    }
  }, [navigate]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logoutAdmin();
      navigate('/admin');
    }
  };

  const handleTokenGenerated = () => {
    // Refresh user list when new token is generated
    setRefreshTrigger(prev => prev + 1);
  };

  if (!adminSession) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-left">
            <h1 className="admin-header-title">GALAXY KICK LOCK 2.0</h1>
            <span className="admin-header-subtitle">Admin Controller</span>
          </div>
          <div className="admin-header-right">
            <span className="admin-username">👤 {adminSession.username}</span>
            <button className="admin-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-container">
          <TokenGenerator onTokenGenerated={handleTokenGenerated} />
          <UserManagement refreshTrigger={refreshTrigger} />
        </div>
      </main>

      {/* Footer */}
      <footer className="admin-footer">
        <p>© 2025 | Galaxy Kick Lock 2.0 Admin Controller | Created by THALA</p>
      </footer>
    </div>
  );
}

export default AdminDashboard;
