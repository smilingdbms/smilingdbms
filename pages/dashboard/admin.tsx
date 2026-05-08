// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
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
  const [rolePermissions, setRolePermissions] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPermissions(); }, [selectedRole]);

  async function fetchPermissions() {
    const { data } = await supabase.from('roles').select('*').eq('role_name', selectedRole).single();
    if (data?.permissions_json) {
      setRolePermissions(prev => ({ ...prev, [selectedRole]: data.permissions_json }));
    }
  }

  const handleRoleToggle = (featureKey) => {
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...(prev[selectedRole] || {}),
        [featureKey]: !(prev[selectedRole]?.[featureKey] || false)
      }
    }));
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    const currentPerms = rolePermissions[selectedRole] || {};
    
    const { error: roleError } = await supabase
      .from('roles')
      .upsert({ role_name: selectedRole, permissions_json: currentPerms }, { onConflict: 'role_name' });

    if (!roleError) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      // Log entry
      await supabase.from('audit_logs').insert([{
        user_id: (await supabase.auth.getUser()).data.user.id,
        action: 'PERMISSION_UPDATE',
        details: `Saved rules for ${selectedRole}`
      }]);
    } else {
      alert("Database Save Error: " + roleError.message);
    }
    setSaving(false);
  };

  const staffPermissionGroups = {
    "ATS & CRM": [
      { key: 'ats_view', label: 'View Candidates' },
      { key: 'ats_add', label: 'Add Candidate' },
      { key: 'crm_view', label: 'View Clients' }
    ]
  };

  return (
    <Layout>
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      <style dangerouslySetInnerHTML={{__html: `
        .admin-layout { display: flex; height: 100vh; background: #050810; color: #fff; width: 100%; }
        .sidebar { background: #11182D; border-right: 1px solid #1F2937; transition: 0.3s; }
        .sidebar-item { padding: 15px 20px; cursor: pointer; color: #9CA3AF; display: flex; align-items: center; gap: 12px; }
        .sidebar-item.active { background: rgba(59, 130, 246, 0.1); color: #60A5FA; border-left: 3px solid #3B82F6; }
        .rbac-sidebar { width: 250px; background: #0b0e14; border-right: 1px solid #1F2937; }
        .rbac-menu-item { padding: 12px 20px; cursor: pointer; color: #9CA3AF; border-bottom: 1px solid #1F2937; }
        .rbac-menu-item.active { background: #3B82F6; color: #fff; }
      `}} />

      <div className="admin-layout">
        {/* MAIN SIDEBAR - All Menus Restored */}
        <div className="sidebar" style={{ width: isSidebarOpen ? '240px' : '70px' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #1F2937', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰ RecruitOS</div>
          <div className={`sidebar-item ${activeModule === 'rbac' ? 'active' : ''}`} onClick={() => setActiveModule('rbac')}>🛡️ {isSidebarOpen && "Control Center"}</div>
          <div className={`sidebar-item ${activeModule === 'team' ? 'active' : ''}`} onClick={() => setActiveModule('team')}>👥 {isSidebarOpen && "Internal Team"}</div>
          <div className={`sidebar-item ${activeModule === 'tenants' ? 'active' : ''}`} onClick={() => setActiveModule('tenants')}>🏢 {isSidebarOpen && "Consultancies"}</div>
          <div className={`sidebar-item ${activeModule === 'features' ? 'active' : ''}`} onClick={() => setActiveModule('features')}>⚙️ {isSidebarOpen && "Feature Matrix"}</div>
          <div className={`sidebar-item ${activeModule === 'logs' ? 'active' : ''}`} onClick={() => setActiveModule('logs')}>📜 {isSidebarOpen && "Platform Logs"}</div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {activeModule === 'rbac' && (
            <>
              <div className="rbac-sidebar">
                <div className={`rbac-menu-item ${activeSubMenu === 'role_wise' ? 'active' : ''}`} onClick={() => setActiveSubMenu('role_wise')}>Role Wise Permissions</div>
                <div className={`rbac-menu-item ${activeSubMenu === 'audit_logs' ? 'active' : ''}`} onClick={() => setActiveSubMenu('audit_logs')}>Security Audit Logs</div>
              </div>
              <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                {activeSubMenu === 'role_wise' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h2>Role Matrix: {selectedRole}</h2>
                      <button onClick={handleSaveMatrix} style={{ background: '#10B981', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                        {saving ? "Saving..." : "Save Policy"}
                      </button>
                    </div>
                    {Object.entries(staffPermissionGroups).map(([group, features]) => (
                      <div key={group}>
                        <h4 style={{ color: '#A855F7' }}>{group}</h4>
                        {features.map(f => (
                          <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', background: '#11182D', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                            <span>{f.label}</span>
                            <input type="checkbox" checked={!!rolePermissions[selectedRole]?.[f.key]} onChange={() => handleRoleToggle(f.key)} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {activeSubMenu === 'audit_logs' && <AuditLogs />}
              </div>
            </>
          )}

          {activeModule === 'team' && <div style={{ padding: '30px', flex: 1 }}><TeamManager /></div>}
          {activeModule === 'tenants' && <div style={{ padding: '30px', flex: 1 }}><h2>Consultancy Management (Coming Soon)</h2></div>}
          {activeModule === 'features' && <div style={{ padding: '30px', flex: 1 }}><h2>Feature Global Control (Coming Soon)</h2></div>}
          {activeModule === 'logs' && <div style={{ padding: '30px', flex: 1 }}><h2>System Logs (Full History)</h2></div>}
        </div>
      </div>
    </Layout>
  );
}