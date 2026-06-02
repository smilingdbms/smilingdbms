// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../src/lib/supabase';
import Layout from '../../src/components/Layout';

// ══════════════════════════════════════════════════════════
// NOTIFICATIONS — full history, clickable, mark read.
// Linked from sidebar: Dashboard > Notifications.
// ══════════════════════════════════════════════════════════

function icon(type) {
  if (type === 'assignment') return '👤';
  if (type === 'mention') return '💬';
  if (type === 'interview') return '🗓️';
  return '🔔';
}

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all | unread

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/'); return; }
    const { data: au } = await supabase.from('app_users').select('*').eq('id', user.id).single();
    if (!au) { router.replace('/'); return; }
    setMe(au);
    const { data } = await supabase.from('notifications')
      .select('*, from_user:app_users!notifications_from_user_id_fkey(full_name)')
      .eq('user_id', au.id).order('created_at', { ascending: false }).limit(100);
    setItems(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function open(n) {
    if (!n.is_read) {
      try { await supabase.from('notifications').update({ is_read: true }).eq('id', n.id); } catch {}
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    const dest = n.link || (n.related_id ? `/dashboard/master?focus=${n.related_id}` : null);
    if (dest) router.push(dest);
  }

  async function markAllRead() {
    if (!me) return;
    try { await supabase.from('notifications').update({ is_read: true }).eq('user_id', me.id).eq('is_read', false); } catch {}
    setItems(prev => prev.map(x => ({ ...x, is_read: true })));
  }

  const shown = filter === 'unread' ? items.filter(n => !n.is_read) : items;
  const unread = items.filter(n => !n.is_read).length;

  return (
    <Layout>
      <div style={{ padding: '4px 2px 40px', maxWidth: 760 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, color: 'var(--tx)' }}>🔔 Notifications</h1>
            <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 3 }}>{unread > 0 ? `${unread} unread` : 'All caught up'}</div>
          </div>
          {unread > 0 && <button onClick={markAllRead} style={{ background: 'var(--acbg)', color: 'var(--ac)', border: '1px solid var(--bd2)', padding: '8px 14px', borderRadius: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Mark all read</button>}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['all', 'unread'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${filter === f ? 'var(--ac)' : 'var(--bd)'}`, background: filter === f ? 'var(--acbg)' : 'transparent', color: filter === f ? 'var(--ac)' : 'var(--mu)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{f}{f === 'unread' && unread > 0 ? ` (${unread})` : ''}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: 'var(--mu)' }}>Loading…</div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--mu2)', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--bd)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shown.map(n => {
              const clickable = !!(n.link || n.related_id);
              return (
                <div key={n.id} onClick={() => open(n)} style={{ padding: '13px 15px', borderRadius: 12, background: n.is_read ? 'var(--bg2)' : 'var(--acbg)', border: `1px solid ${n.is_read ? 'var(--bd)' : 'var(--bd2)'}`, cursor: clickable ? 'pointer' : 'default', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'background 0.12s' }}
                  onMouseEnter={e => clickable && (e.currentTarget.style.background = 'var(--bg3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'var(--bg2)' : 'var(--acbg)')}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {n.title}
                      {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ac)', flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 3 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--mu2)', marginTop: 5 }}>{new Date(n.created_at).toLocaleString('en-IN')}</div>
                  </div>
                  {clickable && <span style={{ fontSize: 12, color: 'var(--ac)', fontWeight: 600, flexShrink: 0, alignSelf: 'center' }}>Open →</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
