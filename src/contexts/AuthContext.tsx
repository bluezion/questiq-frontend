// src/contexts/AuthContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// JWT 인증 컨텍스트 — 로그인/로그아웃/프로필 상태 전역 관리
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from 'react';
import {
  apiLogin, apiRegister, apiLogout, apiGetMe,
  tokenStore, type TeacherProfile, type AuthResult,
} from '../services/studentApiService';

// ── 컨텍스트 타입 ─────────────────────────────────────
interface AuthState {
  isLoggedIn:  boolean;
  isLoading:   boolean;   // 초기 토큰 검증 중
  teacher:     TeacherProfile | null;
  error:       string | null;
}

interface AuthContextValue extends AuthState {
  login:    (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout:   () => void;
  clearError: () => void;
}

export interface RegisterData {
  email: string; password: string; name: string;
  school?: string; subject?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false, isLoading: true, teacher: null, error: null,
  });
  const initialized = useRef(false);

  // 앱 시작 시: 토큰이 있으면 /auth/me 로 검증
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = tokenStore.get();
    if (!token) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    apiGetMe()
      .then(teacher => {
        setState({ isLoggedIn: true, isLoading: false, teacher, error: null });
      })
      .catch(() => {
        tokenStore.clear();
        setState({ isLoggedIn: false, isLoading: false, teacher: null, error: null });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, error: null }));
    try {
      const result: AuthResult = await apiLogin(email, password);
      setState({ isLoggedIn: true, isLoading: false, teacher: result.teacher, error: null });
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message || '로그인에 실패했습니다.' }));
      throw err;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState(s => ({ ...s, error: null }));
    try {
      const result: AuthResult = await apiRegister(data);
      setState({ isLoggedIn: true, isLoading: false, teacher: result.teacher, error: null });
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message || '회원가입에 실패했습니다.' }));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setState({ isLoggedIn: false, isLoading: false, teacher: null, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── 훅 ───────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
