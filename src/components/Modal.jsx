import React, { useState, useEffect } from 'react';

const genRandomPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw.slice(0, 4) + '-' + pw.slice(4, 8) + '-' + pw.slice(8);
};

function Modal({ isOpen, onClose, onCreateUser }) {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('manager');
  const [password, setPassword] = useState('');

  // Regenerate password whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setUserId('');
      setRole('manager');
      setPassword(genRandomPassword());
    }
  }, [isOpen]);

  const handleRegenPassword = (e) => {
    e.preventDefault();
    setPassword(genRandomPassword());
  };

  const handleCreate = () => {
    const trimmedName = name.trim();
    const trimmedUid = userId.trim();

    if (!trimmedName || !trimmedUid) {
      alert('Name and User ID are required');
      return;
    }

    const success = onCreateUser(trimmedName, trimmedUid, role, password);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>Create a new account</h3>
        <p className="sub">Set a user ID and role. A password is generated for you to share securely.</p>

        <div className="field">
          <label>Full name</label>
          <input
            type="text"
            placeholder="e.g. Aayushman Pratap Singh"
            style={{ fontFamily: "'Inter', sans-serif" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>User ID</label>
          <input
            type="text"
            placeholder="e.g. aps-0142"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              padding: '0 14px',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              background: '#fff',
              marginBottom: '8px'
            }}
          >
            <option value="super_admin">Super Admin</option>
            <option value="tenant_admin">Tenant Admin</option>
            <option value="manager">Transition Manager</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* Dynamic role description widget */}
        <div style={{
          background: 'var(--paper)',
          padding: '12px 14px',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--ink-dim)',
          borderLeft: `4px solid ${
            role === 'super_admin' ? '#7C3AED' :
            role === 'tenant_admin' ? '#EA580C' :
            role === 'manager' ? '#2563EB' : '#16A34A'
          }`,
          marginBottom: '20px',
          lineHeight: '1.45',
          transition: 'all 0.15s ease'
        }}>
          <strong>
            {role === 'super_admin' ? 'Super Admin: ' :
             role === 'tenant_admin' ? 'Tenant Admin: ' :
             role === 'manager' ? 'Transition Manager: ' : 'User: '}
          </strong>
          {role === 'super_admin' && 'Root credentials scope. Full system-wide configuration authority, including user management across all nodes and audit trail verification.'}
          {role === 'tenant_admin' && 'Administrative scope. Manage team members, audit security logs, and control workspace config. Locked out of Super Admin deletion.'}
          {role === 'manager' && 'Operational workspace editor scope. Modify active milestones progress and verify transitions checklist scopes.'}
          {role === 'user' && 'Read-only observer scope. View pipelines and milestones logs. Restricted from making edits.'}
        </div>

        <div className="field">
          <label>Password</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type password or generate one"
              style={{
                flex: 1,
                fontFamily: "'JetBrains Mono', monospace"
              }}
            />
            <button
              className="btn-secondary"
              onClick={handleRegenPassword}
              style={{ width: '44px', height: '44px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              title="Generate random password"
            >
              <i className="ti ti-refresh" style={{ fontSize: '15px' }}></i>
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleCreate}>
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
