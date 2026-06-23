import React, { useState } from 'react';

const MOCK_PROJECTS = [
  { 
    id: 'att-p1', 
    name: 'UI Touch Interface Transition', 
    lead: 'Varsha Gaikwad', 
    status: 'In Progress', 
    progress: 78,
    desc: 'Migrating legacy legacy mouse-and-keyboard operator panels to secure AI-assisted gesture and touch surfaces.',
    milestones: [
      { name: 'Initial Touch Mapping', date: '2026-04-10', status: 'completed' },
      { name: 'Data Governance Audit', date: '2026-05-15', status: 'completed' },
      { name: 'Model Fine-tuning & Calibrations', date: '2026-06-01', status: 'active' },
      { name: 'Operator Shadowing Validation', date: '2026-07-10', status: 'pending' },
    ],
    touchpoints: [
      { label: 'Verify operator credentials scopes', done: true },
      { label: 'Register multi-modal input channels', done: true },
      { label: 'Conduct adversarial input injections audit', done: false },
      { label: 'Establish fallback physical overrides control', done: false },
    ]
  },
  { 
    id: 'att-p2', 
    name: 'Edge AI Inference Pipeline', 
    lead: 'Chetan Sethi', 
    status: 'Verifying', 
    progress: 95,
    desc: 'Deploying optimized neural network runtimes directly onto local hardware nodes for sub-10ms response times.',
    milestones: [
      { name: 'Hardware Profiling & Benchmarks', date: '2026-02-20', status: 'completed' },
      { name: 'Quantization & Compression', date: '2026-03-12', status: 'completed' },
      { name: 'Edge Node Deployment', date: '2026-04-05', status: 'completed' },
      { name: 'Real-time Drift Detection', date: '2026-06-14', status: 'active' },
    ],
    touchpoints: [
      { label: 'Quantize FP32 model to INT8', done: true },
      { label: 'Confirm local hardware acceleration keys', done: true },
      { label: 'Configure drift alerts thresholds', done: true },
      { label: 'Map fallback cloud routing triggers', done: true },
    ]
  },
  { 
    id: 'att-p3', 
    name: 'Makers Lab Dashboard Upgrade', 
    lead: 'Aayushman Singh', 
    status: 'Planning', 
    progress: 15,
    desc: 'Upgrading the transition monitoring suite with secure token scopes, visual audit logging, and layout configurations.',
    milestones: [
      { name: 'Core UX Flowcharts Wireframes', date: '2026-06-15', status: 'completed' },
      { name: 'React Component Migration', date: '2026-06-22', status: 'active' },
      { name: 'Secure Backend Authorization integration', date: '2026-07-05', status: 'pending' },
      { name: 'Final Penetration Testing Audit', date: '2026-08-01', status: 'pending' },
    ],
    touchpoints: [
      { label: 'Map dashboard roles permissions matrix', done: true },
      { label: 'Implement client-side XOR password encryption', done: true },
      { label: 'Setup PostgreSQL user_master_2 relation schema', done: true },
      { label: 'Audit JWT token cookie storage parameters', done: false },
    ]
  },
];

function UserView({ currentUser }) {
  const isManager = currentUser.role === 'manager';
  const [selectedProjId, setSelectedProjId] = useState(MOCK_PROJECTS[0].id);
  const [projects, setProjects] = useState(MOCK_PROJECTS);

  const selectedProj = projects.find(p => p.id === selectedProjId) || projects[0];

  const handleToggleTouchpoint = (projId, index) => {
    if (!isManager) return; // Only managers can modify touchpoint completion status
    setProjects(prev => prev.map(p => {
      if (p.id === projId) {
        const updatedTouchpoints = [...p.touchpoints];
        updatedTouchpoints[index] = {
          ...updatedTouchpoints[index],
          done: !updatedTouchpoints[index].done
        };
        // Re-calculate progress based on touchpoint percentage (simple formula)
        const doneCount = updatedTouchpoints.filter(t => t.done).length;
        const progress = Math.round((doneCount / updatedTouchpoints.length) * 100);
        return {
          ...p,
          touchpoints: updatedTouchpoints,
          progress: progress === 0 ? 10 : progress // Keep minor baseline
        };
      }
      return p;
    }));
  };

  return (
    <div id="userView" className="animate-fade-in">
      <div className="page-head">
        <div>
          <h1>Transition Console</h1>
          <p>
            Active session verified. Scoped access control directory in effect for{' '}
            <span style={{ fontWeight: 600, color: 'var(--navy)' }}>
              {currentUser.name} ({currentUser.role === 'manager' ? 'Transition Manager' : currentUser.role === 'user' ? 'User' : currentUser.role.replace('_', ' ')})
            </span>.
          </p>
        </div>
      </div>

      {/* Main session status card */}
      <div className="panel glass-card" style={{ padding: '24px 32px', textAlign: 'center', marginBottom: '32px' }}>
        <i
          className="ti ti-shield-check"
          style={{ fontSize: '32px', color: 'var(--green)', marginBottom: '8px', display: 'block' }}
        ></i>
        <h3 style={{ marginBottom: '6px', fontSize: '17px', fontWeight: 600 }}>
          Session Cryptographically Verified
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-dim)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.5 }}>
          Your cryptographic token has been verified against the secure directory. All active transition actions are scoped, authorized, and logged.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Projects List */}
        <div className="panel">
          <div className="panel-head">
            <h3>Transition Pipeline</h3>
          </div>
          <div style={{ padding: '6px 0' }}>
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => setSelectedProjId(proj.id)}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--paper-dim)',
                  cursor: 'pointer',
                  background: selectedProjId === proj.id ? 'var(--paper)' : 'transparent',
                  transition: 'background 0.2s ease',
                  borderLeft: selectedProjId === proj.id ? '4px solid var(--navy)' : '4px solid transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                    {proj.name}
                  </h4>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      background: proj.status === 'Verifying' ? '#E6F1FB' : proj.status === 'In Progress' ? '#EBF8F0' : '#F1EFE8',
                      color: proj.status === 'Verifying' ? '#185FA5' : proj.status === 'In Progress' ? 'var(--green-text)' : '#5F5E5A',
                    }}
                  >
                    {proj.status}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ink-dim)' }}>Lead: {proj.lead}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Selected Project Detail */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '20px' }}>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
              Project ID: {selectedProj.id}
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
              {selectedProj.name}
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-dim)', marginTop: '8px', lineHeight: '1.6' }}>
              {selectedProj.desc}
            </p>
          </div>

          {/* Milestones Timeline */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: '16px', letterSpacing: '0.05em' }}>
              Verification Milestones
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px' }}>
              <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '6px', width: '2px', background: 'var(--line)' }}></div>
              
              {selectedProj.milestones.map((ms, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'start', gap: '16px', position: 'relative' }}>
                  {/* Timeline Dot */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-20px',
                      top: '4px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: ms.status === 'completed' ? 'var(--green)' : ms.status === 'active' ? 'var(--navy)' : 'var(--line)',
                      border: ms.status === 'active' ? '2px solid #fff' : 'none',
                      boxShadow: ms.status === 'active' ? '0 0 0 2px var(--navy)' : 'none',
                      zIndex: 2
                    }}
                  ></div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '13.5px', 
                        fontWeight: ms.status === 'active' ? 600 : 500,
                        color: ms.status === 'pending' ? 'var(--ink-faint)' : 'var(--ink)'
                      }}>
                        {ms.name}
                      </span>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>{ms.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Touchpoint Checklist */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-dim)', letterSpacing: '0.05em' }}>
                Verification Scopes Checklist
              </h4>
              {isManager ? (
                <span style={{ fontSize: '11px', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                  Click items to mark completed
                </span>
              ) : (
                <span style={{ 
                  fontSize: '10px', 
                  color: 'var(--amber)', 
                  fontWeight: 600, 
                  background: '#FFFBEB', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  border: '1px solid rgba(185, 123, 20, 0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <i className="ti ti-lock" style={{ fontSize: '11px' }}></i> Read-Only View
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedProj.touchpoints.map((tp, idx) => (
                <div
                  key={idx}
                  onClick={() => handleToggleTouchpoint(selectedProj.id, idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    background: 'var(--paper)',
                    borderRadius: '6px',
                    cursor: isManager ? 'pointer' : 'default',
                    border: '1px solid var(--line)',
                    transition: 'border-color 0.15s, background 0.15s'
                  }}
                  className={isManager ? "touchpoint-row" : ""}
                >
                  <input
                    type="checkbox"
                    checked={tp.done}
                    readOnly
                    style={{
                      cursor: isManager ? 'pointer' : 'default',
                      accentColor: 'var(--navy)',
                      width: '15px',
                      height: '15px'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      color: tp.done ? 'var(--ink-dim)' : 'var(--ink)',
                      textDecoration: tp.done ? 'line-through' : 'none',
                      fontWeight: 500
                    }}
                  >
                    {tp.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserView;
