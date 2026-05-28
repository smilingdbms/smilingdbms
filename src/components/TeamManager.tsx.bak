// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function TeamManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    // Hum profiles table se data fetch karenge jisme global_role filter ho sake
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setMembers(data);
    setLoading(false);
  }

  const getRoleBadge = (role) => {
    const styles = {
      'SUPER_ADMIN': { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid #EF4444' },
      'USER': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid #10B981' }
    };
    const style = styles[role] || styles['USER'];
    return (
      <span style={{ ...style, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
        {role}
      </span>
    );
  };

  if (loading) return <div style={{ color: '#6B7280', padding: '20px' }}>Loading core team...</div>;

  return (
    <div style={{ background: '#11182D', borderRadius: '12px', border: '1px solid #1F2937', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#1F2937' }}>
          <tr>
            <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Member Name</th>
            <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Platform Role</th>
            <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Status</th>
            <th style={{ padding: '15px', textAlign: 'right', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #1F2937' }}>
              <td style={{ padding: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{m.full_name || 'Unnamed User'}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{m.email}</div>
              </td>
              <td style={{ padding: '15px' }}>
                {getRoleBadge(m.global_role)}
              </td>
              <td style={{ padding: '15px' }}>
                <span style={{ color: '#10B981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  ● Active
                </span>
              </td>
              <td style={{ padding: '15px', textAlign: 'right' }}>
                <button style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '16px', marginRight: '10px' }} title="Edit Permissions">⚙️</button>
                <button style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '16px' }} title="Remove User">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}