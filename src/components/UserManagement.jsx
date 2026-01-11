import { useState, useEffect } from 'react';
import { getAllUsers, renewUserToken, deleteUser, deleteToken } from '../utils/adminApi';
import './UserManagement.css';

function UserManagement({ refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getAllUsers();

      if (result.success) {
        setUsers(result.users);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewToken = async (userId, months) => {
    setActionLoading({ ...actionLoading, [`renew-${userId}`]: true });

    try {
      const result = await renewUserToken(userId, months);

      if (result.success) {
        alert(`Token renewed successfully for ${months} months!`);
        fetchUsers();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert('Failed to renew token');
    } finally {
      setActionLoading({ ...actionLoading, [`renew-${userId}`]: false });
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading({ ...actionLoading, [`delete-user-${userId}`]: true });

    try {
      const result = await deleteUser(userId);

      if (result.success) {
        alert('User deleted successfully!');
        fetchUsers();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert('Failed to delete user');
    } finally {
      setActionLoading({ ...actionLoading, [`delete-user-${userId}`]: false });
    }
  };

  const handleDeleteToken = async (tokenId, username) => {
    if (!confirm(`Are you sure you want to delete the token for user "${username}"?`)) {
      return;
    }

    setActionLoading({ ...actionLoading, [`delete-token-${tokenId}`]: true });

    try {
      const result = await deleteToken(tokenId);

      if (result.success) {
        alert('Token deleted successfully!');
        fetchUsers();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert('Failed to delete token');
    } finally {
      setActionLoading({ ...actionLoading, [`delete-token-${tokenId}`]: false });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="user-management">
        <h2 className="user-management-title">User Management</h2>
        <div className="loading-state">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <h2 className="user-management-title">User Management</h2>
      <p className="user-management-subtitle">
        Total Users: {users.length}
      </p>

      {error && (
        <div className="user-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="empty-state">
          <p>No users registered yet.</p>
        </div>
      ) : (
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Subscription</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="user-username">{user.username}</td>
                  <td>{user.subscription_months ? `${user.subscription_months} months` : 'N/A'}</td>
                  <td className={isExpired(user.token_expiry_date) ? 'expired-date' : ''}>
                    {formatDate(user.token_expiry_date)}
                  </td>
                  <td>
                    <span className={`status-badge ${isExpired(user.token_expiry_date) ? 'status-expired' : 'status-active'}`}>
                      {isExpired(user.token_expiry_date) ? 'Expired' : 'Active'}
                    </span>
                  </td>
                  <td className="user-actions">
                    <div className="action-buttons">
                      <select
                        className="renew-dropdown"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleRenewToken(user.id, parseInt(e.target.value));
                            e.target.value = '';
                          }
                        }}
                        disabled={actionLoading[`renew-${user.id}`]}
                      >
                        <option value="">Renew Token</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                      </select>
                      
                      {user.token_id && (
                        <button
                          className="action-btn delete-token-btn"
                          onClick={() => handleDeleteToken(user.token_id, user.username)}
                          disabled={actionLoading[`delete-token-${user.token_id}`]}
                        >
                          {actionLoading[`delete-token-${user.token_id}`] ? '...' : 'Delete Token'}
                        </button>
                      )}
                      
                      <button
                        className="action-btn delete-user-btn"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={actionLoading[`delete-user-${user.id}`]}
                      >
                        {actionLoading[`delete-user-${user.id}`] ? '...' : 'Delete User'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
