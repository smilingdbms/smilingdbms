// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });
const AuditLogs = dynamic(() => import('../../src/components/AuditLogs'), { ssr: false });
const TeamManager = dynamic(() => import('../../src/components/TeamManager'), { ssr: false });

export default function SuperAdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState('rbac'); 
  const [activeSubMenu, setActiveSubMenu] = useState('role_wise'); 
  const [selectedRole, setSelectedRole] = useState('Account Owner');

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState("");
  
  // Isme hum database se fetched permissions rakhenge
  const [rolePermissions, setRolePermissions] = useState({});
  const [saving, setSaving] = useState(false);

  // 1. Database se existing permissions load karna (Taaki refresh par data na jaye)
  useEffect(() => {
    fetchPermissions();
  }, [selectedRole]);

  async function fetchPermissions() {
    // Note: Yahan hum roles table se us role ki settings uthayenge
    const { data, error } = await supabase.from('roles').select('*').eq('role_name', selectedRole).single();
    if (data && data.permissions_json) {
      setRolePermissions(prev => ({ ...prev, [selectedRole]: data.permissions_json }));
    }
  }

  // 2. Toggle Handler (Local State)
  const handleRoleToggle = (featureKey) => {
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...(prev[selectedRole] || {}),
        [featureKey]: !(prev[selectedRole]?.[featureKey] || false)
      }
    }));
  };

  // 3. Save Function (Asli Database entry yahan hogi)
  const handleSaveMatrix = async () => {
    setSaving(true);
    const currentPerms = rolePermissions[selectedRole] || {};

    // A. Role ki permissions update karo
    const { error: roleError } = await supabase
      .from('roles')
      .upsert({ role_name: selectedRole, permissions_json: currentPerms }, { onConflict: 'role_name' });

    // B. Audit Log entry manually insert karo (Security Audit Table ke liye)
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: (await supabase.auth.getUser()).data.user.id,
        action: 'PERMISSION_UPDATE',
        details: `Pravin God Mode changed access rules for ${selectedRole}`
      }]);

    if (!roleError && !auditError) {
      setConfettiMessage(`Enterprise Security Matrix Locked for ${selectedRole}`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } else {
      alert("Error saving to database: " + (roleError?.message || auditError?.message));
    }
    setSaving(false);
  };

  const staffPermissionGroups = {
    "ATS Toggles (Pipeline)": [
      { key: 'ats_view', label: 'View Candidates', desc: 'Read access to applicant tracking.' },
      { key: 'ats_add', label: 'Add Candidate', desc: 'Manual entry or parsing.' },
      { key: 'ats_edit', label: 'Edit Candidate', desc: 'Modify details.' },
      { key: 'ats_delete', label: 'Delete Candidate', desc: 'Hard delete from DB.' }
    ],
    "CRM & Finance Toggles": [
      { key: 'crm_view', label: 'View Clients', desc: 'Read access to company database.' },
      { key: 'bill_create', label: 'Create Invoice', desc: 'Generate PDF.' }
    ]
  };

  return (
    <Layout>
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Confetti recycle={false} numberOfPieces={800} gravity={0.15} />
          <div style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)', padding: '20px 40px', borderRadius: '50px', color: '#fff', fontSize: '20px', fontWeight: '800', boxShadow: '0 10px 40px rgba(16,185,129,0.5)' }}>
            🎉 {confettiMessage}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .admin-layout { display: flex; height: 100vh; background: #050810; color: #fff; width: 100%; overflow: hidden; }
        .sidebar { background: #11182D; border-right: 1px solid #1F2937; transition: width 0.3s ease; display: flex; flex-direction: column; }
        .sidebar-item { padding: 15px 20px; display: flex; alignItems: center; gap: 15px; cursor: pointer; color: #9CA3AF; border-left: 3px solid transparent; }
        .sidebar-item.active { background: rgba(59, 130, 246, 0.15); color: #60A5FA; border-left-color: #3B82F6; font-weight: bold; }
        .rbac-sidebar { width: 260px; background: #0b0e14; border-right: 1px solid #1F2937; overflow-y: auto; }
        .rbac-menu-item { padding: 12px 20px; cursor: pointer; color: #9CA3AF; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.02); }
        .rbac-menu-item.active { background: #3B82F6; color: #fff; }
        .toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #374151; transition: .3s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: #9CA3AF; transition: .3s; border-radius: 50%; }
        input:checked + .slider { background-color: #10B981; }
        input:checked + .slider:before { transform: translateX(18px); background-color: #fff; }
      `}} />

      <div className="admin-layout">
        <div className="sidebar" style={{ width: isSidebarOpen ? '240px' : '70px' }}>
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #1F2937' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>☰</button>
          </div>
          <div style={{ flex: 1 }}>
            <div className={`sidebar-item ${activeModule === 'rbac' ? 'active' : ''}`} onClick={() => setActiveModule('rbac')}><span>🛡️</span> {isSidebarOpen && "Control Center"}</div>
            <div className={`sidebar-item ${activeModule === 'team' ? 'active' : ''}`} onClick={() => setActiveModule('team')}><span>👥</span> {isSidebarOpen && "Internal Team"}</div>
          </div>
        </div>

        <div className="main-content" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {activeModule === 'rbac' && (
            <div style={{ display: 'flex', flex: 1 }}>
              <div className="rbac-sidebar">
                <div className={`rbac-menu-item ${activeSubMenu === 'role_wise' ? 'active' : ''}`} onClick={() => setActiveSubMenu('role_wise')}>Role Wise Permissions</div>
                <div className={`rbac-menu-item ${activeSubMenu === 'audit_logs' ? 'active' : ''}`} onClick={() => setActiveSubMenu('audit_logs')}>Security Audit Logs</div>
              </div>

              <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                {activeSubMenu === 'role_wise' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h2>Role Matrix: {selectedRole}</h2>
                      <button onClick={handleSaveMatrix} disabled={saving} style={{ background: '#10B981', color: '#000', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {saving ? "Saving..." : "Save Policy"}
                      </button>
                    </div>
                    {Object.entries(staffPermissionGroups).map(([group, features]) => (
                      <div key={group} style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: '#A855F7', marginBottom: '10px' }}>{group}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                          {features.map(f => (
                            <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#11182D', padding: '12px', borderRadius: '10px' }}>
                              <div><div style={{ fontSize: '13px', fontWeight: 'bold' }}>{f.label}</div></div>
                              <label className="toggle-switch">
                                <input type="checkbox" checked={!!rolePermissions[selectedRole]?.[f.key]} onChange={() => handleRoleToggle(f.key)} />
                                <span className="slider"></span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeSubMenu === 'audit_logs' && <AuditLogs />}
              </div>
            </div>
          )}
          {activeModule === 'team' && <div style={{ padding: '30px', flex: 1 }}><TeamManager /></div>}
        </div>
      </div>
    </Layout>
  );
}