import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import AdminView from './components/AdminView';
import UserView from './components/UserView';
import Modal from './components/Modal';
import Toast from './components/Toast';

const DEFAULT_USERS = [
  { uid: 'super-admin', name: 'Super Admin', role: 'super_admin', created: '2026-01-01', pw: 'admin123' },
  { uid: 'admin-001', name: 'Tenant Administrator', role: 'tenant_admin', created: '2026-01-04', pw: 'admin123' },
  { uid: 'vg-0210', name: 'Varsha Gaikwad', role: 'manager', created: '2026-02-11', pw: 'manager123' },
  { uid: 'cs-1187', name: 'Chetan Sethi', role: 'manager', created: '2026-02-11', pw: 'manager123' },
  { uid: 'aps-0142', name: 'Aayushman Pratap Singh', role: 'user', created: '2026-03-02', pw: 'demo123' }
];

const DEFAULT_AUDIT_LOG = [
  { date: '2026-06-22', ts: '09:41:02', event: 'access_granted', detail: 'vg-0210 — login successful', type: 'granted' },
  { date: '2026-06-22', ts: '09:38:55', event: 'out_of_scope_attempt', detail: 'aps-0142 — tried admin route', type: 'rejected' },
  { date: '2026-06-22', ts: '09:22:10', event: 'access_granted', detail: 'cs-1187 — login successful', type: 'granted' },
  { date: '2026-06-21', ts: '08:55:30', event: 'invalid_token', detail: 'unknown — expired session', type: 'rejected' }
];

function App() {
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [auditLog, setAuditLog] = useState(() => {
    const saved = localStorage.getItem('att_audit_log');
    return saved ? JSON.parse(saved) : DEFAULT_AUDIT_LOG;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('att_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  // Sync audit log to local storage
  useEffect(() => {
    localStorage.setItem('att_audit_log', JSON.stringify(auditLog));
  }, [auditLog]);

  // Sync current user to session storage
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('att_current_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('att_current_user');
    }
  }, [currentUser]);

  // Fetch users from backend if user is admin
  const fetchUsers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/v1/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    if (currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'tenant_admin')) {
      fetchUsers();
    }
  }, [currentUser]);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2600);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('att_access_token');
  };

  // Session inactivity timeout (30 minutes)
  useEffect(() => {
    if (!currentUser) return;

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT);
    };

    const handleInactivityLogout = () => {
      handleLogout();
      showToast('Session expired due to 30 minutes of inactivity');
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser]);

  const handleAddAuditLog = (event, detail, type) => {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10);
    const ts = String(d.getHours()).padStart(2, '0') + ':' +
               String(d.getMinutes()).padStart(2, '0') + ':' +
               String(d.getSeconds()).padStart(2, '0');
    setAuditLog(prev => [{ date: dateStr, ts, event, detail, type }, ...prev]);
  };

  const createUser = async (name, uid, role, pw) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uid, name, role, pw })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Failed to create account');
        return false;
      }

      await fetchUsers();
      setIsModalOpen(false);
      showToast('Account created — share the password securely');
      return true;
    } catch (err) {
      console.error("Failed to create user:", err);
      showToast('Authentication service offline');
      return false;
    }
  };

  const removeUser = async (uid) => {
    if (uid === currentUser?.uid) {
      showToast('Cannot revoke your own active session');
      return;
    }

    // Authorization Check: Tenant Admin cannot delete Super Admin
    const targetUser = users.find(u => u.uid === uid);
    if (targetUser && targetUser.role === 'super_admin' && currentUser?.role === 'tenant_admin') {
      showToast('Access denied — Tenant Admin cannot revoke Super Admin');
      return;
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/v1/users/${uid}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Failed to revoke account');
        return;
      }

      await fetchUsers();
      showToast('Account revoked');
    } catch (err) {
      console.error("Failed to delete user:", err);
      showToast('Authentication service offline');
    }
  };

  return (
    <div className="App">
      {!currentUser ? (
        <LoginScreen
          users={users}
          onLoginSuccess={(user) => setCurrentUser(user)}
          onAddAuditLog={handleAddAuditLog}
        />
      ) : (
        <div id="app-screen">
          <div className="topbar">
            <div className="brand">
              <span className="dot"></span>AI Touch Transition
            </div>
            <div className="right" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                {currentUser.name}
              </span>
              <span className="role-chip" style={{ textTransform: 'capitalize' }}>
                {currentUser.role.replace('_', ' ')}
              </span>
              <button className="logout-link" onClick={handleLogout}>Sign out</button>
            </div>
          </div>

          <div className="main-body">
            {(currentUser.role === 'super_admin' || currentUser.role === 'tenant_admin') ? (
              <AdminView
                users={users}
                auditLog={auditLog}
                currentUser={currentUser}
                onOpenModal={() => setIsModalOpen(true)}
                onRemoveUser={removeUser}
              />
            ) : (
              <UserView currentUser={currentUser} />
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateUser={createUser}
      />

      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}

export default App;
