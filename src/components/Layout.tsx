// @ts-nocheck
import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function Layout({ children }) {
  // Dimaag (Zustand) se state nikaal rahe hain
  const { loadUserEcosystem, isAppLoading, isSuperAdmin, user } = useAuthStore();

  useEffect(() => {
    // App khulte hi sabse pehle user permissions load karo
    loadUserEcosystem();
  }, [loadUserEcosystem]);

  // Jab tak database permissions fetch kar raha hai, loading screen dikhao
  if (isAppLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#050810', color: '#fff', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid rgba(59, 130, 246, 0.2)', borderTop: '4px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h2 style={{ marginTop: '25px', color: '#60A5FA', letterSpacing: '3px', fontWeight: '800', fontSize: '16px' }}>INITIALIZING RECUITOS...</h2>
        <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '5px' }}>Securing Tenant Connection</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Agar user successfully load ho gaya hai
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#050810' }}>
      
      {/* 🛡️ GOD MODE INDICATOR: Sirf Super Admin ko dikhega */}
      {isSuperAdmin && (
        <div style={{ background: 'linear-gradient(90deg, #EF4444, #A855F7)', color: '#fff', padding: '6px', textAlign: 'center', fontSize: '11px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)', zIndex: 9999 }}>
          🛡️ Super Admin God Mode Active — Unrestricted Access
        </div>
      )}

      {/* Yahan aapke andar ke pages (Admin, BD, ATS) render honge */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {children}
      </main>
      
    </div>
  );
}