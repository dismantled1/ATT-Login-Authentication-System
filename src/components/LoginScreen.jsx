import React, { useState, useEffect, useRef } from 'react';

const ENCRYPTION_KEY = 'SDLC-AUTH-KEY-2026-SECURE-V1';

const encryptPassword = (password) => {
  let xored = '';
  for (let i = 0; i < password.length; i++) {
    const charCode = password.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    xored += String.fromCharCode(charCode);
  }
  return btoa(xored);
};

function LoginScreen({ users, onLoginSuccess, onAddAuditLog }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [auditMessage, setAuditMessage] = useState('awaiting credentials…');
  const [isVerifying, setIsVerifying] = useState(false);
  const auditLineRef = useRef(null);

  // Cycle audit strip message with a small fade transition
  const cycleAuditLine = (msg) => {
    if (auditLineRef.current) {
      auditLineRef.current.style.opacity = '0';
      setTimeout(() => {
        setAuditMessage(msg);
        if (auditLineRef.current) {
          auditLineRef.current.style.opacity = '1';
        }
      }, 150);
    } else {
      setAuditMessage(msg);
    }
  };

  // Listen to input changes to update status line
  useEffect(() => {
    if (isVerifying) return;
    if (userId.trim().length > 0) {
      if (password.length > 0) {
        cycleAuditLine('verifying signature…');
      } else {
        cycleAuditLine('checking directory…');
      }
    } else {
      cycleAuditLine('awaiting credentials…');
    }
  }, [userId, password, isVerifying]);

  const handleLogin = async () => {
    if (isVerifying) return;

    const trimmedUid = userId.trim();
    if (!trimmedUid || !password) return;

    setError('');
    setIsVerifying(true);
    cycleAuditLine('checking directory…');

    try {
      // XOR encrypt password
      const encryptedPassword = encryptPassword(password);
      
      // Send credentials to backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedUid,
          password: encryptedPassword,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.message || 'Invalid user ID or password.');
        cycleAuditLine('rejected — invalid credentials');
        const details = `${trimmedUid} — login rejected`;
        onAddAuditLog('invalid_or_expired_token', details, 'rejected');
        setIsVerifying(false);
        return;
      }

      // Simulated secure transition sequence
      const sequences = [
        'resolving scopes…',
        'verifying cryptographic session…',
        'access granted — redirecting…'
      ];

      let delay = 0;
      sequences.forEach((msg, index) => {
        delay += 350;
        setTimeout(() => {
          cycleAuditLine(msg);
          if (index === sequences.length - 1) {
            setTimeout(() => {
              const details = `${trimmedUid} — login successful`;
              onAddAuditLog('access_granted', details, 'granted');
              // Store token in localStorage
              localStorage.setItem('att_access_token', responseData.access_token);
              // Trigger success callback with user metadata
              onLoginSuccess(responseData.metadata);
            }, 250);
          }
        }, delay);
      });
    } catch (err) {
      console.error('API Error:', err);
      setError('Authentication service unavailable.');
      cycleAuditLine('rejected — service offline');
      const details = `${trimmedUid} — server unreachable`;
      onAddAuditLog('service_error', details, 'rejected');
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div id="login-screen" onKeyDown={handleKeyDown}>
      <div className="login-card animate-fade-in">
        <h2>ATT Secure Gateway</h2>
        <p className="sub">Provide authorized identity credentials to verify session scopes.</p>

        {error && (
          <div className="login-error">
            <i className="ti ti-alert-circle"></i>
            <span>{error}</span>
          </div>
        )}

        <div className="field">
          <label htmlFor="userid">Identity Identifier</label>
          <input
            type="text"
            id="userid"
            placeholder="e.g. amk-2210"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isVerifying}
            autoComplete="username"
          />
        </div>
        
        <div className="field">
          <div className="field-row">
            <label htmlFor="password">Password</label>
          </div>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isVerifying}
            autoComplete="current-password"
          />
        </div>

        <button 
          className="login-btn" 
          onClick={handleLogin}
          disabled={isVerifying || !userId || !password}
        >
          <i className="ti ti-lock" style={{ fontSize: '15px' }}></i>
          {isVerifying ? 'Verifying session...' : 'Verify and sign in'}
        </button>

        <p className="helper-note">
          Access credentials are provisioned solely by system directory administrators.
        </p>

        <div className="audit-strip" id="auditStrip">
          <div className="line active" ref={auditLineRef}>
            <span className="blip"></span>
            {auditMessage}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
