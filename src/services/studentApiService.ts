// src/services/studentApiService.ts
// ─────────────────────────────────────────────────────────────────────────────
// 학생 데이터 백엔드 API 통신 서비스
// - JWT 인증 헤더 자동 주입
// - 재시도 로직 (429/503)
// - 오프라인 폴백 (로컬스토리지)
// ─────────────────────────────────────────────────────────────────────────────
import type { StudentRecord, ClassStats, AiComment } from '../types/teacher';
import type { DiagnosticResult } from '../types/diagnostic';
import { getApiBaseUrl } from './questiqApi';

// BASE_URL을 매 요청마다 동적으로 읽어 런타임 주입을 반영합니다.
const getAPI = () => `${getApiBaseUrl()}/api/v1`;

// ── 로컬 토큰 관리 ────────────────────────────────────
export const tokenStore = {
  get: ()  => localStorage.getItem('questiq_teacher_token') ?? '',
  set: (t: string) => localStorage.setItem('questiq_teacher_token', t),
  clear: () => localStorage.removeItem('questiq_teacher_token'),
};

// ── fetch 래퍼 (자동 인증 헤더 + 에러 정규화) ────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${getAPI()}${path}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(30000),
  });

  // 401: 토큰 만료 → 자동 토큰 갱신 시도
  if (res.status === 401 && retries > 0) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return apiFetch<T>(path, options, retries - 1);
    tokenStore.clear();
    throw Object.assign(new Error('인증이 만료되었습니다. 다시 로그인해주세요.'), { code: 'AUTH_EXPIRED' });
  }

  // 429: Rate limit → 잠시 후 재시도
  if (res.status === 429 && retries > 0) {
    await new Promise(r => setTimeout(r, 2000));
    return apiFetch<T>(path, options, retries - 1);
  }

  const body = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { statusCode: res.status });
  }
  return body as T;
}

async function tryRefreshToken(): Promise<boolean> {
  const token = tokenStore.get();
  if (!token) return false;
  try {
    const res = await fetch(`${getAPI()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return false;
    const body = await res.json();
    if (body.success && body.data?.token) {
      tokenStore.set(body.data.token);
      return true;
    }
    return false;
  } catch { return false; }
}

// ══════════════════════════════════════════════════════
//  인증 API
// ══════════════════════════════════════════════════════

export interface TeacherProfile {
  id: string; email: string; name: string;
  school?: string; subject?: string; role: string;
}
export interface AuthResult {
  token: string;
  teacher: TeacherProfile;
}

export async function apiRegister(data: {
  email: string; password: string; name: string; school?: string; subject?: string;
}): Promise<AuthResult> {
  const res = await apiFetch<{ success: boolean; data: AuthResult }>('/auth/register', {
    method: 'POST', body: JSON.stringify(data),
  });
  tokenStore.set(res.data.token);
  return res.data;
}

export async function apiLogin(email: string, password: string): Promise<AuthResult> {
  const res = await apiFetch<{ success: boolean; data: AuthResult }>('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
  tokenStore.set(res.data.token);
  return res.data;
}

export function apiLogout() {
  tokenStore.clear();
}

export async function apiGetMe(): Promise<TeacherProfile> {
  const res = await apiFetch<{ success: boolean; data: TeacherProfile }>('/auth/me');
  return res.data;
}

// ══════════════════════════════════════════════════════
//  학생 CRUD API
// ══════════════════════════════════════════════════════

export interface ListStudentsParams {
  page?: number; limit?: number; group?: string;
  search?: string; sortField?: string; sortDir?: 'asc' | 'desc';
  classId?: string;   // 클래스별 필터링 (멀티 클래스 지원)
}
export interface PaginatedStudents {
  students: StudentRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function apiListStudents(params: ListStudentsParams = {}): Promise<PaginatedStudents> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
  const res = await apiFetch<{ success: boolean; students: StudentRecord[]; pagination: PaginatedStudents['pagination'] }>(
    `/students?${qs}`
  );
  return { students: res.students, pagination: res.pagination };
}

export async function apiGetStudent(id: string): Promise<StudentRecord> {
  const res = await apiFetch<{ success: boolean; data: StudentRecord }>(`/students/${id}`);
  return res.data;
}

export async function apiCreateStudent(data: {
  name: string; grade: string; group?: string; studentCode?: string; classId?: string;
}): Promise<StudentRecord> {
  const res = await apiFetch<{ success: boolean; data: StudentRecord }>('/students', {
    method: 'POST', body: JSON.stringify(data),
  });
  return res.data;
}

export async function apiUpdateStudent(id: string, data: Partial<{
  name: string; grade: string; group: string; studentCode: string;
}>): Promise<StudentRecord> {
  const res = await apiFetch<{ success: boolean; data: StudentRecord }>(`/students/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  });
  return res.data;
}

export async function apiDeleteStudent(id: string): Promise<void> {
  await apiFetch(`/students/${id}`, { method: 'DELETE' });
}

export async function apiBulkDeleteStudents(ids: string[]): Promise<number> {
  const res = await apiFetch<{ success: boolean; data: { deletedCount: number } }>(
    '/students/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }
  );
  return res.data.deletedCount;
}

// ══════════════════════════════════════════════════════
//  진단 결과 저장 API
// ══════════════════════════════════════════════════════

export async function apiSaveDiagnosticPre(
  studentId: string, diagnosticResult: DiagnosticResult
): Promise<StudentRecord> {
  const res = await apiFetch<{ success: boolean; data: StudentRecord }>(
    `/students/${studentId}/diagnostic/pre`,
    { method: 'PUT', body: JSON.stringify({ diagnosticResult }) }
  );
  return res.data;
}

export async function apiSaveDiagnosticPost(
  studentId: string, diagnosticResult: DiagnosticResult
): Promise<StudentRecord> {
  const res = await apiFetch<{ success: boolean; data: StudentRecord }>(
    `/students/${studentId}/diagnostic/post`,
    { method: 'PUT', body: JSON.stringify({ diagnosticResult }) }
  );
  return res.data;
}

export async function apiSaveAiComment(
  studentId: string, comment: Omit<AiComment, 'studentId'>
): Promise<StudentRecord> {
  const res = await apiFetch<{ success: boolean; data: StudentRecord }>(
    `/students/${studentId}/ai-comment`,
    { method: 'PUT', body: JSON.stringify({ comment }) }
  );
  return res.data;
}

// ══════════════════════════════════════════════════════
//  통계 API
// ══════════════════════════════════════════════════════

export async function apiGetClassStats(): Promise<ClassStats> {
  const res = await apiFetch<{ success: boolean; data: ClassStats }>('/students/stats');
  return res.data;
}

export async function apiGetGroups(): Promise<string[]> {
  const res = await apiFetch<{ success: boolean; data: string[] }>('/students/groups');
  return res.data;
}

// ══════════════════════════════════════════════════════
//  연결 상태 확인
// ══════════════════════════════════════════════════════

export async function apiHealthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch { return false; }
}
