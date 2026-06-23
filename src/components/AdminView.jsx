import React from 'react';

function AdminView({ users, auditLog, currentUser, onOpenModal, onRemoveUser }) {
  const roleLabel = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'tenant_admin': return 'Tenant Admin';
      case 'manager': return 'Transition Manager';
      case 'user': return 'User';
      default: return role;
    }
  };

  // Compute stats dynamically from audit log state
  const grantedCount = auditLog.filter(a => a.type === 'granted').length;
  const rejectedCount = auditLog.filter(a => a.type === 'rejected').length;

  // Group audit logs by date
  const groupedAuditLog = auditLog.slice(0, 15).reduce((groups, item) => {
    const date = item.date || '2026-06-22';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedAuditLog).sort((a, b) => b.localeCompare(a));

  return (
    <div id="adminView" className="animate-fade-in">
      <div className="page-head">
        <div>
          <h1>Identity Scope Registry</h1>
          <p>Configure cryptographic identity scopes, assign roles, and audit access trials.</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="label">Registered Identities</div>
          <div className="val">{users.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Security Grants</div>
          <div className="val green">{grantedCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Authorization Rejections</div>
          <div className="val amber">{rejectedCount}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Identities Directory</h3>
          <button className="add-btn" onClick={onOpenModal}>
            <i className="ti ti-plus" style={{ fontSize: '14px' }}></i>
            Provision Identity
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td className="uid-cell">{u.uid}</td>
                <td>{u.name}</td>
                <td>
                  <span className={`role-badge ${u.role}`}>
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td style={{ color: 'var(--ink-dim)' }}>{u.created}</td>
                <td>
                  {u.role === 'super_admin' && currentUser?.role === 'tenant_admin' ? (
                    <span style={{ fontSize: '12px', color: 'var(--ink-faint)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Restricted — Tenant Admin cannot revoke Super Admin">
                      <i className="ti ti-lock" style={{ fontSize: '13px' }}></i> Locked
                    </span>
                  ) : (
                    <button 
                      className="row-action" 
                      onClick={() => onRemoveUser(u.uid)}
                      disabled={u.uid === currentUser?.uid}
                      style={u.uid === currentUser?.uid ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role scopes reference panel */}
      <div className="panel role-reference-panel">
        <div className="panel-head" style={{ borderBottom: '1px solid var(--line)' }}>
          <h3>Identity Scopes Reference Guide</h3>
        </div>
        <div className="role-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          padding: '20px 24px'
        }}>
          <div className="role-desc-card" style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            borderLeft: '4px solid #7C3AED'
          }}>
            <h4 style={{ color: '#7C3AED', fontWeight: 600, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-shield-lock" style={{ fontSize: '15px' }}></i> Super Admin
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ink-dim)', marginTop: '8px', lineHeight: '1.5' }}>
              System-wide root authority. Authorized to provision/revoke any identity (including admins) and inspect the complete audit trail.
            </p>
          </div>
          
          <div className="role-desc-card" style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            borderLeft: '4px solid #EA580C'
          }}>
            <h4 style={{ color: '#EA580C', fontWeight: 600, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-user-check" style={{ fontSize: '15px' }}></i> Tenant Admin
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ink-dim)', marginTop: '8px', lineHeight: '1.5' }}>
              Tenant authority. Authorized to provision managers and users, audit trails, and manage scopes. Restricted from revoking Super Admins.
            </p>
          </div>

          <div className="role-desc-card" style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            borderLeft: '4px solid #2563EB'
          }}>
            <h4 style={{ color: '#2563EB', fontWeight: 600, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-adjustments" style={{ fontSize: '15px' }}></i> Transition Manager
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ink-dim)', marginTop: '8px', lineHeight: '1.5' }}>
              Operational authority. Authorized to modify milestone progress and update verification checklist scopes. Read-only access to directory.
            </p>
          </div>

          <div className="role-desc-card" style={{
            background: 'var(--paper)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            borderLeft: '4px solid #16A34A'
          }}>
            <h4 style={{ color: '#16A34A', fontWeight: 600, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-eye" style={{ fontSize: '15px' }}></i> User
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ink-dim)', marginTop: '8px', lineHeight: '1.5' }}>
              Operational observer. Read-only access to transition pipelines, milestones, and checklist statuses. Restricted from modifications.
            </p>
          </div>
        </div>
      </div>

      <div className="panel audit-log-panel">
        <div className="panel-head">
          <h3>Security Verification Audit Trail</h3>
        </div>
        <div id="auditLogBody" style={{ padding: 0 }}>
          {sortedDates.map((date) => (
            <div key={date}>
              <div style={{
                padding: '8px 24px',
                background: 'var(--paper)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--ink-dim)',
                borderBottom: '1px solid var(--line)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {date}
              </div>
              {groupedAuditLog[date].map((a, idx) => (
                <div className="audit-row" key={idx}>
                  <span className="ts mono">{a.ts}</span>
                  <span className="ev">
                    <span className={`audit-dot ${a.type}`}></span>
                    {a.event}
                  </span>
                  <span className="detail">{a.detail}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminView;
