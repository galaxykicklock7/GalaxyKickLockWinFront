import { useState } from 'react';
import { loginUser } from '../utils/auth';
import './Auth.css';

function SignIn({ onSuccess, onSwitchToSignUp }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginUser(username, password);

      if (result.success) {
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }
        
        onSuccess(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load remembered username on mount
  useState(() => {
    const remembered = localStorage.getItem('rememberedUsername');
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="auth-form">
      <h2 className="auth-title">Welcome Back</h2>
      
      {error && (
        <div className="auth-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            autoComplete="username"
            disabled={loading}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        {/* Remember Me Checkbox */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          marginTop: '4px'
        }}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer',
              accentColor: '#3b82f6'
            }}
          />
          <label 
            htmlFor="rememberMe" 
            style={{
              fontSize: '0.875rem',
              color: 'rgba(148, 163, 184, 0.9)',
              cursor: 'pointer',
              userSelect: 'none',
              margin: 0,
              fontWeight: 400
            }}
          >
            Remember me
          </label>
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-switch">
        <p>
          Don't have an account?{' '}
          <button 
            type="button"
            onClick={onSwitchToSignUp}
            className="auth-link"
            disabled={loading}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignIn;
