import React, { useState } from 'react';
import { loginWithGoogle, loginAnonymously, loginWithEmail, isFirebaseConfigured } from '../firebase';
import { LogIn, Orbit } from 'lucide-react';
import './Auth.css';

export default function Auth({ onLogin }) {
  const [error, setError] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      if (isFirebaseConfigured) {
        const result = await loginWithGoogle();
        onLogin(result.user);
      } else {
        // Mock login for demonstration if firebase isn't configured
        const mockUser = {
          uid: 'demo-user-123',
          displayName: 'Demo User',
          photoURL: `https://ui-avatars.com/api/?name=Demo+User&background=dd2476&color=fff`
        };
        onLogin(mockUser);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleGuestLogin = async () => {
    try {
      if (isFirebaseConfigured) {
        const result = await loginAnonymously();
        // Give anonymous users a default name so they don't break the UI
        if (!result.user.displayName) {
          result.user.displayName = 'Wandering Yogi';
        }
        onLogin(result.user);
      } else {
        onLogin({ uid: 'guest-123', displayName: 'Wandering Yogi' });
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured) {
        const result = await loginWithEmail(email, password, isSignUp);
        if (isSignUp && !result.user.displayName) {
          result.user.displayName = 'New Yogi';
        }
        onLogin(result.user);
      } else {
        onLogin({ uid: 'email-123', displayName: 'Demo Yogi' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-icon-wrapper">
          <Orbit size={48} strokeWidth={1} color="#ffffff" className="auth-icon-svg" />
        </div>
        <h1 className="auth-title">Pulse</h1>
        <p className="auth-subtitle">Track your daily chants, build streaks, and find peace.</p>
        
        {!isFirebaseConfigured && (
          <div className="demo-notice">
            Firebase is not configured. Running in Demo Mode.
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {!showEmailForm ? (
          <>
            <button className="google-btn" onClick={handleGoogleLogin}>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <button 
              onClick={() => setShowEmailForm(true)}
              className="guest-btn"
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '1rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.02)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.8rem',
                transition: 'all 0.3s'
              }}
              onMouseOver={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              ✉️ Continue with Email
            </button>

            <button 
              onClick={handleGuestLogin}
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '1rem',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: 'none',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textDecoration: 'underline'
              }}
            >
              👤 Or continue as Guest
            </button>
          </>
        ) : (
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <button 
              type="button" 
              onClick={() => { setShowEmailForm(false); setError(null); }} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: 0 }}
            >
              ← Back
            </button>
            <input 
              type="email" 
              placeholder="Email address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
              style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', fontFamily: 'inherit' }} 
            />
            <input 
              type="password" 
              placeholder="Password (min 6 chars)" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none', fontFamily: 'inherit' }} 
            />
            <button 
              type="submit" 
              disabled={loading} 
              style={{ background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.85rem', textDecoration: 'underline' }}
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          By continuing, you agree to our <a href="#" style={{ color: 'var(--accent-1)', textDecoration: 'none' }}>Privacy Policy</a> and <a href="#" style={{ color: 'var(--accent-1)', textDecoration: 'none' }}>Terms of Service</a>.
        </div>
      </div>
    </div>
  );
}
