'use client';

import type { User } from '@/types/user';

function generateToken(): string {
  const arr = new Uint8Array(12);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr, (v) => v.toString(16).padStart(2, '0')).join('');
}

const user = {
  id: 'USR-000',
  avatar: '/assets/avatar.png',
  firstName: 'Sofia',
  lastName: 'Rivers',
  email: 'sofia@devias.io',
} satisfies User;

export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

// Helper to get JWT token from localStorage
function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('custom-auth-token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

class AuthClient {
  async signUp(params: SignUpParams): Promise<{ error?: string }> {
    const { firstName, lastName, email, password } = params;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `${firstName} ${lastName}`.trim(),
          email,
          password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success' && data.data.token) {
        localStorage.setItem('custom-auth-token', data.data.token);
        return {};
      } else {
        return { error: data.message || 'Registration failed' };
      }
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social authentication not implemented' };
  }

  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
    const { email, password } = params;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success' && data.data.token) {
        localStorage.setItem('custom-auth-token', data.data.token);
        return {};
      } else {
        return { error: data.message || 'Invalid email or password' };
      }
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  }

  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Password reset not implemented' };
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update reset not implemented' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    const token = localStorage.getItem('custom-auth-token');
    if (!token) {
      return { data: null };
    }
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          ...getAuthHeader()
        } as HeadersInit,
      });
      const data = await res.json();
      if (res.ok && data.status === 'success' && data.data) {
        return { data: data.data };
      } else if (res.status === 401) {
        // Not authenticated, but not a fatal error
        return { data: null };
      } else {
        return { data: null, error: data.message || 'Not authenticated' };
      }
    } catch (err: any) {
      return { data: null, error: err.message || 'Network error' };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    localStorage.removeItem('custom-auth-token');

    return {};
  }
}

export const authClient = new AuthClient();
