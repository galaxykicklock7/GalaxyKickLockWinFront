import { useState } from 'react';
import SignIn from '../components/SignIn';
import SignUp from '../components/SignUp';
import Toast from '../components/Toast';
import './LandingPage.css';

function LandingPage({ onLoginSuccess }) {
  const [showSignUp, setShowSignUp] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const handleSignUpSuccess = () => {
    setShowSignUp(false);
    showToast('Account created successfully! Please sign in.', 'success');
  };

  return (
    <div className="landing-page">
      {/* Fixed Header */}
      <div className="landing-header-fixed">
        <h1 className="landing-title">Galaxy Kick Lock</h1>
        <h2 className="landing-version">2.0</h2>
      </div>

      {/* Scrollable Content Area */}
      <div className="landing-content">
        <div className="auth-container">
          <div className="auth-content">
            {showSignUp ? (
              <SignUp 
                onSuccess={handleSignUpSuccess}
                onSwitchToSignIn={() => setShowSignUp(false)}
              />
            ) : (
              <SignIn 
                onSuccess={onLoginSuccess}
                onSwitchToSignUp={() => setShowSignUp(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <footer className="landing-footer-fixed">
        <p>© 2025 | Created by THALA</p>
      </footer>

      {/* TOAST OVERLAY */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default LandingPage;
