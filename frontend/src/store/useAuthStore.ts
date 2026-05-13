import { create } from 'zustand';
import api from '../api/axios';

interface Student {
  id: number;
  mssv: string;
  name: string;
  birthday?: string;
  gender?: string;
  id_card?: string;
  hometown?: string;
  address?: string;
  phone?: string;
  class_id?: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  email?: string | null;
  role: 'QTV' | 'LECTURER' | 'BCH' | 'STUDENT';
  studentId?: number | null;
  class_id?: string | null;
  phone?: string | null;
  major_name?: string | null;
  student?: Student | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authInitialized: boolean;
  initializeAuth: () => Promise<void>;
  login: (user: User) => void;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  authInitialized: false,
  initializeAuth: async () => {
    // 1. Check if we already handled a logout in this session
    const justLoggedOut = localStorage.getItem('qlsv_just_logged_out');
    if (justLoggedOut === 'true') {
      localStorage.removeItem('qlsv_just_logged_out');
      set({ user: null, isAuthenticated: false, authInitialized: true });
      return;
    }

    // 2. If already initialized and not authenticated, don't re-fetch unless forced
    // This helps prevent loops if multiple components trigger initializeAuth
    const state = useAuthStore.getState();
    if (state.authInitialized && !state.isAuthenticated) {
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.user) {
        set({ user: res.data.user, isAuthenticated: true, authInitialized: true });
      } else {
        set({ user: null, isAuthenticated: false, authInitialized: true });
      }
    } catch (_error: any) {
      set({ user: null, isAuthenticated: false, authInitialized: true });
      
      // If it's a 401, we definitely aren't logged in
      if (_error.response?.status === 401) {
        // No extra action needed, the state update above will trigger the UI change
      }
    }
  },
  login: (user) => {
    localStorage.removeItem('qlsv_just_logged_out');
    set({ user, isAuthenticated: true, authInitialized: true });
  },
  setUser: (user) => {
    set({ user, isAuthenticated: true, authInitialized: true });
  },
  logout: async () => {
    // 1. Mark as logged out locally immediately
    localStorage.setItem('qlsv_just_logged_out', 'true');
    
    // 2. Clear all potentially sensitive local data
    sessionStorage.clear();
    
    try {
      // 3. Inform server to clear cookies
      await api.post('/auth/logout');
    } catch (_error) {
      // ignore
    } finally {
      // 4. Reset store state
      set({ user: null, isAuthenticated: false, authInitialized: true });
    }
  },
}));
