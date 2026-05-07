import React, { useState } from 'react';
import axios from 'axios';
import backgroundImage from './Images/image.png';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // Call onLogin to update App state
        onLogin();
        
        /* Redirect based on role returned from server, as a form of security and privileges granting system */
        if (response.data.role === 'admin') {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/customer-dashboard';
        }
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundSvg}>
        <svg width="800" viewBox="0 0 1000 500" fill="none" stroke="#3b82f6">
          <path d="M100,250 Q250,100 400,250 T700,250" strokeWidth="1" />
          <circle cx="500" cy="250" r="200" strokeWidth="0.5" strokeDasharray="5,5" />
        </svg>
      </div>

      <div style={styles.header}>
        <div style={styles.iconContainer}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h1 style={styles.title}>FEDERAL 20!</h1>
        <span style={styles.warningText}>Unauthorized entry is strictly prohibited.</span>
      </div>

      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>USERNAME</label>
            <input 
              type="text" 
              style={styles.input}
              placeholder="Enter your username."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>ACCESS KEY</label>
            <input 
              type="password" 
              style={styles.input}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={styles.forgotContainer}>
              <span style={styles.forgotLink}>Forgot Password?</span>
            </div>
          </div>

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'VERIFYING...' : 'SIGN IN'}
          </button>
        </form>
      </div>

      <div style={styles.footer}>
        <div style={styles.badgeRow}>
          <span style={styles.badge}>ENCRYPTED</span>
          <span style={styles.badge}>COMPLIANT</span>
          <span style={styles.badge}>SECURED</span>
        </div>
        <p style={styles.footerText}>FEDERAL 20! TO THE WORLD @2026</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0c12',
    fontFamily: 'Courier New, monospace',
    position: 'relative',
    margin: 0,
    padding: '20px',
    boxSizing: 'border-box'
  },
  backgroundSvg: {
    position: 'absolute',
    opacity: 0.05,
    pointerEvents: 'none',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    zIndex: 10
  },
  iconContainer: {
    color: '#60a5fa',
    marginBottom: '0.5rem'
  },
  title: {
    fontSize: '28px',
    letterSpacing: '0.2em',
    color: '#e2e8f0',
    marginBottom: '0.5rem',
    fontWeight: 'normal'
  },
  warningText: {
    fontStyle: 'italic',
    fontSize: '12px',
    color: '#64748b'
  },
  formContainer: {
    backgroundColor: 'rgba(17, 20, 29, 0.9)',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    zIndex: 10
  },
  inputGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
    color: '#94a3b8',
    display: 'block',
    marginBottom: '0.5rem'
  },
  input: {
    width: '100%',
    backgroundColor: '#0a0c10',
    border: '1px solid #1e293b',
    borderRadius: '4px',
    padding: '12px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Courier New, monospace'
  },
  forgotContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '0.5rem'
  },
  forgotLink: {
    fontSize: '10px',
    color: '#60a5fa',
    cursor: 'pointer'
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: '12px',
    marginBottom: '1rem',
    textAlign: 'center',
    padding: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '4px'
  },
  button: {
    width: '100%',
    backgroundColor: '#1e293b',
    color: '#60a5fa',
    fontWeight: 'bold',
    padding: '12px',
    border: '1px solid #3b82f6',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: 'Courier New, monospace',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  footer: {
    position: 'absolute',
    bottom: '2rem',
    textAlign: 'center',
    width: '100%',
    zIndex: 10
  },
  badgeRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '1rem'
  },
  badge: {
    fontSize: '8px',
    letterSpacing: '0.1em',
    color: '#3b82f6'
  },
  footerText: {
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: '#334155',
    margin: 0
  }
};

export default Login;