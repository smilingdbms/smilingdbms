// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase.from('audit_view').select('*').limit(50);
      if (!error) setLogs(data);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  if (loading) return <div style={{ color: 'var(--mu2)', padding: '20px' }}>Loading platform activities...</div>;

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--bg3)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: 'var(--bg3)' }}>
          <tr>
            <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: 'var(--mu)', textTransform: 'uppercase' }}>Timestamp</th>
            <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: 'var(--mu)', textTransform: 'uppercase' }}>Actor</th>
            <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: 'var(--mu)', textTransform: 'uppercase' }}>Action</th>
            <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', color: 'var(--mu)', textTransform: 'uppercase' }}>Consultancy</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: '1px solid var(--bg3)' }}>
              <td style={{ padding: '15px', fontSize: '12px', color: 'var(--mu2)' }}>
                {new Date(log.created_at).toLocaleString('en-GB')}
              </td>
              <td style={{ padding: '15px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{log.actor_name || 'System'}</div>
                <div style={{ fontSize: '11px', color: 'var(--mu2)' }}>{log.actor_email}</div>
              </td>
              <td style={{ padding: '15px' }}>
                <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                  {log.action}
                </span>
                <div style={{ fontSize: '11px', color: 'var(--mu)', marginTop: '5px' }}>{log.details}</div>
              </td>
              <td style={{ padding: '15px', fontSize: '13px', color: 'var(--tx)' }}>
                {log.consultancy_name || 'Platform Level'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}