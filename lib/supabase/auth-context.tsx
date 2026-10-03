'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './client';
import { Profile } from '@/types';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password?: string, displayName?: string, username?: string) => Promise<{ error?: string }>;
  loginDirect: (params: {
    displayName: string;
    emailOrPhone?: string;
    role?: 'user' | 'admin';
    bikeType?: string;
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'cm_mks_auth_user';
const LOCAL_PROFILE_KEY = 'cm_mks_auth_profile';
const SIGNED_OUT_KEY = 'cm_mks_has_signed_out';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser({ id: session.user.id, email: session.user.email });
            
            // Fetch profile
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (prof && mounted) {
              setProfile(prof as Profile);
            }
          }

          const client = supabase;
          const { data: { subscription } } = client.auth.onAuthStateChange(
            async (_event, session) => {
              if (session?.user && mounted) {
                setUser({ id: session.user.id, email: session.user.email });
                const { data: prof } = await client
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .maybeSingle();
                if (prof && mounted) setProfile(prof as Profile);
              } else if (mounted) {
                setUser(null);
                setProfile(null);
              }
            }
          );

          return () => {
            subscription.unsubscribe();
          };
        } else {
          // Demo / Local storage mode with persistent storage
          const localUser = localStorage.getItem(LOCAL_USER_KEY);
          const localProf = localStorage.getItem(LOCAL_PROFILE_KEY);
          const hasSignedOut = localStorage.getItem(SIGNED_OUT_KEY);

          if (localUser && localProf && mounted) {
            setUser(JSON.parse(localUser));
            setProfile(JSON.parse(localProf));
          } else if (!hasSignedOut && mounted) {
            // Provide default initial demo rider on very first visit
            const defaultUser = { id: 'rider-demo-01', email: 'gowes@makassar.id' };
            const defaultProfile: Profile = {
              id: 'rider-demo-01',
              username: 'pesepeda_mks',
              display_name: 'Pesepeda Makassar',
              avatar_url: null,
              role: 'user',
              is_anonymous: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setUser(defaultUser);
            setProfile(defaultProfile);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(defaultUser));
            localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(defaultProfile));
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const loginDirect = async ({
    displayName,
    emailOrPhone = '',
    role = 'user',
  }: {
    displayName: string;
    emailOrPhone?: string;
    role?: 'user' | 'admin';
    bikeType?: string;
  }): Promise<{ error?: string }> => {
    try {
      const cleanName = displayName.trim();
      if (!cleanName) return { error: 'Nama tampilan tidak boleh kosong' };

      const cleanUsername = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const userId = `user-${cleanUsername}-${Date.now().toString().slice(-4)}`;
      const userEmail = emailOrPhone.includes('@')
        ? emailOrPhone
        : `${cleanUsername}@criticalmass.mks`;

      const loggedUser = { id: userId, email: userEmail };
      const loggedProfile: Profile = {
        id: userId,
        username: cleanUsername,
        display_name: cleanName,
        avatar_url: null,
        role: role,
        is_anonymous: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(loggedUser);
      setProfile(loggedProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(loggedUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(loggedProfile));
      localStorage.removeItem(SIGNED_OUT_KEY);

      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal masuk';
      return { error: message };
    }
  };

  const signInWithEmail = async (email: string, password = 'password123'): Promise<{ error?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error: error.message };
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email });
        }
        return {};
      }

      // Demo login
      const cleanName = email.split('@')[0];
      const demoUser = { id: `user-${Date.now()}`, email };
      const demoProfile: Profile = {
        id: demoUser.id,
        username: cleanName.toLowerCase(),
        display_name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        avatar_url: null,
        role: email.includes('admin') ? 'admin' : 'user',
        is_anonymous: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUser(demoUser);
      setProfile(demoProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(demoProfile));
      localStorage.removeItem(SIGNED_OUT_KEY);
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal masuk';
      return { error: message };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password = 'password123',
    displayName = '',
    username = ''
  ): Promise<{ error?: string }> => {
    try {
      const finalDisplayName = displayName || email.split('@')[0];
      const finalUsername = (username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: finalDisplayName,
              username: finalUsername,
            },
          },
        });
        if (error) return { error: error.message };
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email });
        }
        return {};
      }

      // Demo signup
      const newUser = { id: `user-${Date.now()}`, email };
      const newProfile: Profile = {
        id: newUser.id,
        username: finalUsername,
        display_name: finalDisplayName,
        avatar_url: null,
        role: email.includes('admin') ? 'admin' : 'user',
        is_anonymous: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUser(newUser);
      setProfile(newProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
      localStorage.removeItem(SIGNED_OUT_KEY);
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mendaftar';
      return { error: message };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    localStorage.setItem(SIGNED_OUT_KEY, 'true');
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error?: string }> => {
    if (!profile) return { error: 'Tidak ada profil aktif' };
    const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);
      if (error) return { error: error.message };
    }

    setProfile(updated);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
    return {};
  };

  const isAdmin = profile?.role === 'admin' || user?.email?.includes('admin') === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin,
        signInWithEmail,
        signUpWithEmail,
        loginDirect,
        signOut,
        updateProfile,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
