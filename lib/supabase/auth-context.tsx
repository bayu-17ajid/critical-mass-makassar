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
const STABLE_RIDER_ID_KEY = 'cm_mks_rider_id';

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
        // Step 1: Read local state immediately so user experiences zero flicker on refresh
        const hasSignedOut = typeof window !== 'undefined' && localStorage.getItem(SIGNED_OUT_KEY) === 'true';
        let initialUser: { id: string; email?: string } | null = null;
        let initialProfile: Profile | null = null;

        if (!hasSignedOut && typeof window !== 'undefined') {
          const localUserStr = localStorage.getItem(LOCAL_USER_KEY);
          const localProfStr = localStorage.getItem(LOCAL_PROFILE_KEY);
          if (localUserStr && localProfStr) {
            try {
              initialUser = JSON.parse(localUserStr);
              initialProfile = JSON.parse(localProfStr);
              if (mounted && initialUser && initialProfile) {
                setUser(initialUser);
                setProfile(initialProfile);
              }
            } catch (e) {
              console.error('Failed to parse local user profile:', e);
            }
          }
        }

        // Step 2: Supabase integration
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && mounted) {
              const cloudUser = { id: session.user.id, email: session.user.email };
              setUser(cloudUser);
              if (typeof window !== 'undefined') {
                localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(cloudUser));
                localStorage.removeItem(SIGNED_OUT_KEY);
              }

              const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (prof && mounted) {
                setProfile(prof as Profile);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(prof));
                }
              }
            } else if (initialProfile && initialUser && mounted) {
              // Synchronize persistent local rider/admin with Supabase profiles table
              const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', initialUser.id)
                .maybeSingle();

              if (prof && mounted) {
                setProfile(prof as Profile);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(prof));
                }
              } else if (!prof) {
                // Upsert local profile into Supabase so foreign relations and attendee lookups work
                await supabase.from('profiles').upsert({
                  id: initialProfile.id,
                  username: initialProfile.username,
                  display_name: initialProfile.display_name,
                  role: initialProfile.role || 'user',
                  bike_type: initialProfile.bike_type || null,
                  is_anonymous: Boolean(initialProfile.is_anonymous),
                  updated_at: new Date().toISOString(),
                });
              }
            }
          } catch (cloudErr) {
            console.warn('Supabase auth sync warning:', cloudErr);
          }

          // Step 3: Listen for auth state changes
          const client = supabase;
          const { data: { subscription } } = client.auth.onAuthStateChange(
            async (_event, session) => {
              if (session?.user && mounted) {
                const cloudUser = { id: session.user.id, email: session.user.email };
                setUser(cloudUser);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(cloudUser));
                  localStorage.removeItem(SIGNED_OUT_KEY);
                }

                const { data: prof } = await client
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .maybeSingle();
                if (prof && mounted) {
                  setProfile(prof as Profile);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(prof));
                  }
                }
              } else if (!session && mounted) {
                // Only wipe if user explicitly signed out or has no local session
                const isExplicitSignOut = typeof window !== 'undefined' && localStorage.getItem(SIGNED_OUT_KEY) === 'true';
                const hasLocal = typeof window !== 'undefined' && localStorage.getItem(LOCAL_USER_KEY);
                if (isExplicitSignOut || !hasLocal) {
                  setUser(null);
                  setProfile(null);
                }
              }
            }
          );

          return () => {
            subscription.unsubscribe();
          };
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
    bikeType,
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

      // Reuse stable ID if already exists for this rider to prevent losing previous data/attendance
      let userId: string;
      const existingRiderId = typeof window !== 'undefined' ? localStorage.getItem(STABLE_RIDER_ID_KEY) : null;
      if (role === 'admin') {
        userId = existingRiderId?.startsWith('admin-')
          ? existingRiderId
          : `admin-${cleanUsername}-${Date.now().toString().slice(-4)}`;
      } else {
        userId = existingRiderId || `rider-${cleanUsername}-${Date.now().toString().slice(-4)}`;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STABLE_RIDER_ID_KEY, userId);
      }

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
        bike_type: bikeType || undefined,
        is_anonymous: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(loggedUser);
      setProfile(loggedProfile);

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(loggedUser));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(loggedProfile));
        localStorage.removeItem(SIGNED_OUT_KEY);
      }

      // Upsert profile into Supabase so database relations work 100%
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('profiles').upsert({
            id: userId,
            username: cleanUsername,
            display_name: cleanName,
            role: role,
            bike_type: bikeType || null,
            is_anonymous: false,
            updated_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn('Failed to upsert profile to Supabase:', dbErr);
        }
      }

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

      // Local login fallback
      const cleanName = email.split('@')[0];
      return loginDirect({
        displayName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        emailOrPhone: email,
        role: email.includes('admin') ? 'admin' : 'user',
      });
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

      return loginDirect({
        displayName: finalDisplayName,
        emailOrPhone: email,
        role: email.includes('admin') ? 'admin' : 'user',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mendaftar';
      return { error: message };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
      localStorage.setItem(SIGNED_OUT_KEY, 'true');
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error?: string }> => {
    if (!profile) return { error: 'Tidak ada profil aktif' };
    const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: profile.id,
            username: updated.username,
            display_name: updated.display_name,
            role: updated.role || 'user',
            bike_type: updated.bike_type || null,
            is_anonymous: Boolean(updated.is_anonymous),
            updated_at: updated.updated_at,
          });
      } catch (dbErr) {
        console.warn('Failed to update profile on Supabase:', dbErr);
      }
    }

    setProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
    }
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
