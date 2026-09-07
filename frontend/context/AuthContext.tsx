'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  domain: string;
  role: string;
}

export interface AuthConfig {
  googleAuthEnabled: boolean;
  domainRestrictionEnabled: boolean;
  allowedDomains: string[];
  allowPersonalGmail: boolean;
  registrationNote?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  authConfig: AuthConfig | null;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshConfig: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthStateProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const refreshConfig = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/campus/auth-config`);
      const data = await res.json();
      if (data.success && data.config) {
        setAuthConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load auth config:', err);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  const user: UserProfile | null = useMemo(() => {
    if (!session?.user?.email) return null;
    const email = session.user.email.toLowerCase();
    const domain = (session.user as any).domain || email.split('@')[1] || '';
    const role =
      (session.user as any).role ||
      (domain.includes('parul') ? 'student' : 'user');

    return {
      id: (session.user as any).id || email,
      name: session.user.name || email.split('@')[0],
      email,
      avatar: session.user.image || '',
      domain,
      role,
    };
  }, [session]);

  const loginWithGoogle = async () => {
    await signIn('google', { callbackUrl: window.location.href });
  };

  const logout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authConfig,
        isLoading: status === 'loading',
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginWithGoogle,
        logout,
        refreshConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthStateProvider>{children}</AuthStateProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
