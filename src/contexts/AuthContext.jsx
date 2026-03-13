import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [role, setRole] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [noCompany, setNoCompany] = useState(false);

  const fetchCompany = useCallback(async (userId) => {
    if (!isSupabaseConfigured || !supabase || !userId) return;

    setCompanyLoading(true);
    setNoCompany(false);

    try {
      const { data: membership, error: memErr } = await supabase
        .from('company_users')
        .select('company_id, role, companies(id, name, slug, logo_url, modules, settings, active)')
        .eq('user_id', userId)
        .single();

      if (memErr || !membership) {
        console.warn('Usuario sin empresa asignada:', userId);
        setNoCompany(true);
        setCompanyId(null);
        setRole(null);
        setCompany(null);
        return;
      }

      setCompanyId(membership.company_id);
      setRole(membership.role);
      setCompany(membership.companies);
    } catch (err) {
      console.error('Error al obtener empresa:', err);
      setNoCompany(true);
    } finally {
      setCompanyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchCompany(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchCompany(session.user.id);
      } else {
        setCompanyId(null);
        setRole(null);
        setCompany(null);
        setNoCompany(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchCompany]);

  const login = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: { message: 'Supabase no está configurado.' } };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const logout = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      loading: loading || companyLoading,
      companyId,
      role,
      company,
      noCompany,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
