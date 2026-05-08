// @ts-nocheck
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,             
  profile: null,          
  activeTenant: null,     
  role: null,             
  isSuperAdmin: false,    
  isAppLoading: true,     

  loadUserEcosystem: async () => {
    try {
      set({ isAppLoading: true });

      // 1. Session Check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session || sessionError) {
        set({ isAppLoading: false, user: null });
        return;
      }

      const currentUser = session.user;

      // 2. Profile & God Mode Check
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      const isGodMode = profileData?.global_role === 'SUPER_ADMIN';

      // 3. Tenant (Consultancy) Check for Normal Users
      let tenantDetails = null;
      let roleDetails = null;

      if (!isGodMode) {
        const { data: tenantLink } = await supabase
          .from('tenant_users')
          .select('tenants(*), roles(*)')
          .eq('user_id', currentUser.id)
          .eq('status', 'Active')
          .single();
          
        if (tenantLink) {
          tenantDetails = tenantLink.tenants;
          roleDetails = tenantLink.roles;
        }
      }

      // 4. State Update
      set({
        user: currentUser,
        profile: profileData,
        isSuperAdmin: isGodMode,
        activeTenant: tenantDetails,
        role: roleDetails,
        isAppLoading: false
      });

    } catch (error) {
      console.error("❌ RecruitOS Auth Engine Error:", error.message);
      set({ isAppLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, activeTenant: null, role: null, isSuperAdmin: false });
    window.location.href = '/'; 
  }
}));