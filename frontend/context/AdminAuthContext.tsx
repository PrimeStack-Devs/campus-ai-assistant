'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';

export interface AdminUser {
  email: string;
  name: string;
  role: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const TOKEN_KEY = 'dexa_admin_token';
const ADMIN_USER_KEY = 'dexa_admin_user';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // Helper to generate auth headers for admin API calls
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const savedToken =
      token ||
      (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
    if (savedToken) {
      return {
        Authorization: `Bearer ${savedToken}`,
      };
    }
    const adminKey =
      process.env.NEXT_PUBLIC_ADMIN_KEY || 'soikjdascmklsdjnviosbnjk';
    return {
      'x-admin-key': adminKey,
    };
  }, [token]);

  // Initial token verification on mount
  useEffect(() => {
    const verifyStoredSession = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(ADMIN_USER_KEY);

        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        // Verify with backend
        const res = await fetch(`${backendUrl}/api/admin/verify`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        const data = await res.json();
        if (data.success && data.admin) {
          setToken(storedToken);
          setAdmin(data.admin);
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(ADMIN_USER_KEY);
          setToken(null);
          setAdmin(null);
        }
      } catch (err) {
        console.error('[AdminAuth] Verification error:', err);
        // Fallback to stored user if network is momentarily unavailable
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(ADMIN_USER_KEY);
        if (storedToken && storedUser) {
          try {
            setToken(storedToken);
            setAdmin(JSON.parse(storedUser));
          } catch {}
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyStoredSession();
  }, [backendUrl]);

  // Login action
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Authentication failed. Please check your credentials.',
        };
      }

      const receivedToken = data.token;
      const receivedAdmin = data.admin;

      // Save to localStorage
      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(receivedAdmin));

      // Also set secure session cookie for Next.js middleware / SSR compatibility
      if (typeof document !== 'undefined') {
        document.cookie = `dexa_admin_session=${receivedToken}; path=/; max-age=${
          7 * 24 * 60 * 60
        }; SameSite=Lax`;
      }

      setToken(receivedToken);
      setAdmin(receivedAdmin);

      return { success: true };
    } catch (err: any) {
      console.error('[AdminAuth] Login error:', err);
      return {
        success: false,
        error:
          'Unable to connect to the administration server. Please verify backend is running.',
      };
    }
  };

  // Logout action
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    if (typeof document !== 'undefined') {
      document.cookie =
        'dexa_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    setToken(null);
    setAdmin(null);
    router.push('/admin/login');
  }, [router]);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isLoading,
        login,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
