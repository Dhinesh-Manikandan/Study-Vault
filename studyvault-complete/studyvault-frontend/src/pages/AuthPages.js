// Login.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const apiUrlHint = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

function AuthAside({ mode = 'login' }) {
  const isLogin = mode === 'login';

  return (
    <aside className="auth-aside" aria-label="Support and quick help">
      <div className="auth-aside-card">
        <div className="auth-aside-eyebrow">StudyVault Support</div>
        <h2 className="auth-aside-title">Need help quickly?</h2>
        <p className="auth-aside-text">
          For forgot credentials, feature requests, bug reports, or suggestions,
          reach us at
          {' '}
          <a href="mailto:support.dhinesh@gmail.com">support.dhinesh@gmail.com</a>
        </p>
      </div>

      <div className="auth-aside-card auth-aside-card-muted">
        <div className="auth-aside-eyebrow">Why StudyVault</div>
        <ul className="auth-aside-list">
          <li>Smart folder organization for each semester</li>
          <li>Revision tags to focus before exams</li>
          <li>{isLogin ? 'Continue exactly where you left off' : 'Create your vault and start adding resources'}</li>
        </ul>
      </div>
    </aside>
  );
}

export function Login() {
  const { signIn } = useAuth();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(identity, password);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Signed in');
    } catch (err) {
      toast.error(err?.response?.data?.message || `Unable to sign in. Check API URL: ${apiUrlHint}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">📚</div>
            <div className="auth-logo-text">Study<span>Vault</span></div>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in with your username and password</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter your username"
                value={identity}
                onChange={e => setIdentity(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-field">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>
          <p className="auth-switch">Don't have an account? <Link to="/register">Sign up free</Link></p>
        </div>
        <AuthAside mode="login" />
      </div>
    </div>
  );
}

// Register.js
export function Register() {
  const { signUp } = useAuth();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { error } = await signUp(identity, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || `Unable to create account. Check API URL: ${apiUrlHint}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">📚</div>
            <div className="auth-logo-text">Study<span>Vault</span></div>
          </div>
          <h1 className="auth-title">Create your vault</h1>
          <p className="auth-sub">Create a multi-user account for your study vault</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="Choose a username"
                value={identity}
                onChange={e => setIdentity(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-field">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
        <AuthAside mode="register" />
      </div>
    </div>
  );
}

export default Login;
