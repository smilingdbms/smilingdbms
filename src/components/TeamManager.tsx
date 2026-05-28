// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ROLE_OPTIONS = ['account_owner','team_manager','team_leader','sr_recruiter','recruiter','individual_recruiter','bd','job_seeker'];
const STATUS_TABS = ['all','active','pending','disabled','rejected'];

export default function TeamManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState('');
  const [editingRole, setEditingRole] = useState('');

  useEffect(() => { fetchTeam(); }, []);

  async function fetchTeam() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: au } = await supabase.from('app_users').select('role, company_id, full_name').eq('id', user.id).single();
    setCurrentUser({ ...au, id: user.id });
    let query = supabase.from('app_users').select('id, full_name, email, role, status, created_at, company_id, phone, mobile, designation, last_login_at').order('created_at', { ascending: false });
    if (!['super_admin','platform_admin','platform_manager'].includes(au?.role)) {
      query = query.eq('company_id', au?.company_id);
    }
    const { data, error } = await query;
    if (!error && data) setMembers(data);
    setLoading(false);
  }

  async function handleStatusChange(userId, newStatus, actionLabel) {
    if (!window.confirm(`Are you sure you want to ${actionLabel} this user?`)) return;
    setProcessing(userId);
    const { error } = await supabase.from('app_users').update({ status: newStatus }).eq('id', userId);
    if (!error) {
      await supabase.from('audit_logs').insert([{ user_id: userId, action: `USER_${newStatus.toUpperCase()}`, details: `User ${actionLabel} by admin` }]).catch(()=>{});
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, status: newStatus } : m));
    } else { alert('Error: ' + error.message); }
    setProcessing('');
  }

  async function handleRoleChange(userId, newRole) {
    setProcessing(userId);
    const { error } = await supabase.from('app_users').update({ role: newRole }).eq('id', userId);
    if (!error) {
      await supabase.from('audit_logs').insert([{ user_id: userId, action: 'ROLE_CHANGED', details: `Role changed to ${newRole}` }]).catch(()=>{});
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
    } else { alert('Error: ' + error.message); }
    setProcessing('');
    setEditingRole('');
  }

  async function handleDelete(userId, name) {
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    if (!window.confirm(`FINAL CONFIRMATION: Delete ${name} from the platform?`)) return;
    setProcessing(userId);
    const { error } = await supabase.from('app_users').delete().eq('id', userId);
    if (!error) {
      setMembers(prev => prev.filter(m => m.id !== userId));
    } else { alert('Error: ' + error.message); }
    setProcessing('');
  }

  const isSA = ['super_admin','platform_admin','platform_manager'].includes(currentUser?.role);
  const isAO = currentUser?.role === 'account_owner';
  const canManage = isSA || isAO;

  const filtered = members.filter(m => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (m.full_name||'').toLowerCase().includes(q) || (m.email||'').toLowerCase().includes(q);
    }
    return true;
  });

  const counts = { all: members.length, active: 0, pending: 0, disabled: 0, rejected: 0 };
  members.forEach(m => { if (counts[m.status] !== undefined) counts[m.status]++; });

  const getRoleBadge = (role) => {
    const c = { super_admin:'#EF4444', account_owner:'#F59E0B', team_manager:'#818CF8', team_leader:'#A78BFA', sr_recruiter:'#34D399', recruiter:'#10B981', individual_recruiter:'#06B6D4', bd:'#60A5FA', job_seeker:'#9CA3AF' };
    const color = c[role] || '#9CA3AF';
    return <span style={{ background: `${color}20`, color, padding:'3px 8px', borderRadius:5, fontSize:11, fontWeight:700, border:`1px solid ${color}40` }}>{(role||'user').replace(/_/g,' ').replace(/\b\w/g,x=>x.toUpperCase())}</span>;
  };

  const statusColor = { active:'#10B981', pending:'#F59E0B', disabled:'#EF4444', rejected:'#6B7280' };

  if (loading) return <div style={{color:'#6B7280',padding:20}}>Loading team...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{margin:0,fontSize:20,color:'#fff'}}>{isSA ? 'All Platform Users' : 'My Team'}</h2>
          <p style={{margin:'4px 0 0',color:'#6B7280',fontSize:13}}>{filtered.length} of {members.length} members</p>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email..." style={{background:'#11182D',border:'1px solid #1F2937',borderRadius:8,padding:'8px 14px',color:'#fff',fontSize:13,width:250,outline:'none'}} />
      </div>

      {/* Status Filter Tabs */}
      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {STATUS_TABS.map(s => (
          <button key={s} onClick={()=>setStatusFilter(s)} style={{
            padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid',
            background: statusFilter===s ? (statusColor[s]||'#3B82F6')+'20' : 'transparent',
            color: statusFilter===s ? (statusColor[s]||'#3B82F6') : '#6B7280',
            borderColor: statusFilter===s ? (statusColor[s]||'#3B82F6')+'60' : '#1F2937',
          }}>
            {s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)} ({counts[s]||0})
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{background:'#11182D',borderRadius:12,border:'1px solid #1F2937',overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
          <thead style={{background:'#1F2937'}}>
            <tr>
              {['Member','Role','Status','Joined','Last Login','Actions'].map(h=>(
                <th key={h} style={{padding:'12px 15px',textAlign:h==='Actions'?'right':'left',fontSize:11,color:'#9CA3AF',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#6B7280'}}>
                {search ? 'No matches found' : `No ${statusFilter==='all'?'':statusFilter+' '}members`}
              </td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} style={{borderBottom:'1px solid #1F2937',background:m.status==='pending'?'rgba(245,158,11,0.03)':'transparent'}}>
                {/* Member */}
                <td style={{padding:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:statusColor[m.status]||'#374151',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#fff',flexShrink:0,opacity:0.8}}>
                      {(m.full_name||m.email||'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{m.full_name||'No name'}</div>
                      <div style={{fontSize:11,color:'#6B7280'}}>{m.email}</div>
                      {m.designation && <div style={{fontSize:10,color:'#4B5563'}}>{m.designation}</div>}
                    </div>
                  </div>
                </td>
                {/* Role */}
                <td style={{padding:12}}>
                  {editingRole === m.id ? (
                    <select value={m.role} onChange={e=>handleRoleChange(m.id,e.target.value)} onBlur={()=>setEditingRole('')} autoFocus style={{background:'#1F2937',color:'#fff',border:'1px solid #374151',borderRadius:6,padding:'4px 8px',fontSize:12}}>
                      {ROLE_OPTIONS.map(r=><option key={r} value={r}>{r.replace(/_/g,' ').replace(/\b\w/g,x=>x.toUpperCase())}</option>)}
                    </select>
                  ) : (
                    <span onClick={()=>canManage && m.id!==currentUser?.id && m.role!=='super_admin' && setEditingRole(m.id)} style={{cursor:canManage&&m.id!==currentUser?.id?'pointer':'default'}} title={canManage?'Click to change role':''}>
                      {getRoleBadge(m.role)}
                    </span>
                  )}
                </td>
                {/* Status */}
                <td style={{padding:12}}>
                  <span style={{color:statusColor[m.status]||'#9CA3AF',fontSize:12,fontWeight:600}}>● {(m.status||'active').charAt(0).toUpperCase()+(m.status||'active').slice(1)}</span>
                </td>
                {/* Joined */}
                <td style={{padding:12,fontSize:12,color:'#6B7280',whiteSpace:'nowrap'}}>
                  {new Date(m.created_at).toLocaleDateString('en-IN')}
                </td>
                {/* Last Login */}
                <td style={{padding:12,fontSize:11,color:'#4B5563',whiteSpace:'nowrap'}}>
                  {m.last_login_at ? new Date(m.last_login_at).toLocaleDateString('en-IN') : 'Never'}
                </td>
                {/* Actions */}
                <td style={{padding:12,textAlign:'right',whiteSpace:'nowrap'}}>
                  {m.id === currentUser?.id ? (
                    <span style={{fontSize:11,color:'#4B5563'}}>You</span>
                  ) : m.role === 'super_admin' && !isSA ? (
                    <span style={{fontSize:11,color:'#4B5563'}}>—</span>
                  ) : canManage ? (
                    <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                      {m.status === 'pending' && <>
                        <button onClick={()=>handleStatusChange(m.id,'active','approve')} disabled={processing===m.id} style={{background:'rgba(16,185,129,0.15)',border:'1px solid #10B981',color:'#10B981',padding:'5px 12px',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:11}}>
                          {processing===m.id?'...':'✅ Approve'}
                        </button>
                        <button onClick={()=>handleStatusChange(m.id,'rejected','reject')} disabled={processing===m.id} style={{background:'rgba(239,68,68,0.1)',border:'1px solid #EF4444',color:'#EF4444',padding:'5px 12px',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:11}}>
                          {processing===m.id?'...':'❌ Reject'}
                        </button>
                      </>}
                      {m.status === 'active' && (
                        <button onClick={()=>handleStatusChange(m.id,'disabled','disable')} disabled={processing===m.id} style={{background:'rgba(239,68,68,0.08)',border:'1px solid #374151',color:'#EF4444',padding:'5px 12px',borderRadius:6,cursor:'pointer',fontSize:11}}>
                          {processing===m.id?'...':'Disable'}
                        </button>
                      )}
                      {(m.status === 'disabled' || m.status === 'rejected') && (
                        <button onClick={()=>handleStatusChange(m.id,'active','reactivate')} disabled={processing===m.id} style={{background:'rgba(16,185,129,0.1)',border:'1px solid #374151',color:'#10B981',padding:'5px 12px',borderRadius:6,cursor:'pointer',fontSize:11}}>
                          {processing===m.id?'...':'Activate'}
                        </button>
                      )}
                      <button onClick={()=>handleDelete(m.id,m.full_name||m.email)} disabled={processing===m.id} style={{background:'transparent',border:'1px solid #374151',color:'#6B7280',padding:'5px 10px',borderRadius:6,cursor:'pointer',fontSize:13}} title="Delete">
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <span style={{fontSize:11,color:'#4B5563'}}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
