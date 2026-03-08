// src/services/classApiService.ts
// ─────────────────────────────────────────────────────────────────────────────
// 클래스 CRUD + 학생 진단 제출 API 통신
// ─────────────────────────────────────────────────────────────────────────────
import type { ClassRecord, DiagnosticSubmission, PublicClassInfo, ApproveResult, LinkSettings } from '../types/class';
import type { DiagnosticResult } from '../types/diagnostic';
import { tokenStore } from './studentApiService';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const API  = `${BASE}/api/v1`;

// ── fetch 래퍼 ────────────────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${API}${path}`, {
    ...options, headers,
    signal: AbortSignal.timeout(30000),
  });
  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { statusCode: res.status });
  return body as T;
}

// ══════════════════════════════════════════════════════
//  클래스 CRUD (교사 인증 필요)
// ══════════════════════════════════════════════════════

export async function apiListClasses(): Promise<ClassRecord[]> {
  const r = await apiFetch<{ success: boolean; data: ClassRecord[] }>('/classes');
  return r.data;
}

export async function apiGetClass(id: string): Promise<ClassRecord> {
  const r = await apiFetch<{ success: boolean; data: ClassRecord }>(`/classes/${id}`);
  return r.data;
}

export async function apiCreateClass(data: {
  name: string; school?: string; grade?: string; subject?: string;
  year?: number; description?: string;
}): Promise<ClassRecord> {
  const r = await apiFetch<{ success: boolean; data: ClassRecord }>('/classes', {
    method: 'POST', body: JSON.stringify(data),
  });
  return r.data;
}

export async function apiUpdateClass(id: string, data: Partial<ClassRecord>): Promise<ClassRecord> {
  const r = await apiFetch<{ success: boolean; data: ClassRecord }>(`/classes/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  });
  return r.data;
}

export async function apiDeleteClass(id: string): Promise<void> {
  await apiFetch(`/classes/${id}`, { method: 'DELETE' });
}

export async function apiRegenShareCode(classId: string): Promise<string> {
  const r = await apiFetch<{ success: boolean; data: { shareCode: string } }>(
    `/classes/${classId}/regen-code`, { method: 'POST' }
  );
  return r.data.shareCode;
}

export async function apiUpdateLinkSettings(classId: string, settings: Partial<LinkSettings>): Promise<ClassRecord> {
  const r = await apiFetch<{ success: boolean; data: ClassRecord }>(
    `/classes/${classId}/link`, { method: 'PUT', body: JSON.stringify(settings) }
  );
  return r.data;
}

// ══════════════════════════════════════════════════════
//  제출 관리 (교사 인증 필요)
// ══════════════════════════════════════════════════════

export interface ListSubmissionsResult {
  submissions: DiagnosticSubmission[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function apiListSubmissions(
  classId: string,
  params: { status?: string; page?: number; limit?: number } = {}
): Promise<ListSubmissionsResult> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
  const r = await apiFetch<{ success: boolean; submissions: DiagnosticSubmission[]; pagination: ListSubmissionsResult['pagination'] }>(
    `/classes/${classId}/submissions?${qs}`
  );
  return { submissions: r.submissions, pagination: r.pagination };
}

export async function apiApproveSubmission(
  classId: string, submissionId: string, mergeToStudentId?: string
): Promise<ApproveResult> {
  const r = await apiFetch<{ success: boolean; data: ApproveResult }>(
    `/classes/${classId}/submissions/${submissionId}/approve`,
    { method: 'POST', body: JSON.stringify({ mergeToStudentId }) }
  );
  return r.data;
}

export async function apiBulkApprove(
  classId: string, ids: string[]
): Promise<{ succeeded: number; failed: number }> {
  const r = await apiFetch<{ success: boolean; data: { succeeded: number; failed: number } }>(
    `/classes/${classId}/submissions/bulk-approve`,
    { method: 'POST', body: JSON.stringify({ ids }) }
  );
  return r.data;
}

export async function apiRejectSubmission(
  classId: string, submissionId: string, note?: string
): Promise<DiagnosticSubmission> {
  const r = await apiFetch<{ success: boolean; data: DiagnosticSubmission }>(
    `/classes/${classId}/submissions/${submissionId}/reject`,
    { method: 'POST', body: JSON.stringify({ note }) }
  );
  return r.data;
}

// ══════════════════════════════════════════════════════
//  학생용 공개 API (인증 불필요)
// ══════════════════════════════════════════════════════

export async function apiGetPublicClassInfo(shareCode: string): Promise<PublicClassInfo> {
  const r = await fetch(`${API}/submit/info/${shareCode}`, { signal: AbortSignal.timeout(10000) });
  const body = await r.json();
  if (!r.ok) throw Object.assign(new Error(body.error || '유효하지 않은 코드입니다.'), { statusCode: r.status });
  return body.data as PublicClassInfo;
}

export interface SubmitDiagnosticPayload {
  studentName:    string;
  studentCode?:   string;
  grade?:         string;
  constructScores: DiagnosticResult['constructScores'];
  totalAverage:   number;
  totalNormalized:number;
  totalLevel:     string;
  durationSeconds?:number;
  fingerprint?:   string;
}

export async function apiSubmitDiagnostic(
  shareCode: string,
  type: 'pre' | 'post',
  payload: SubmitDiagnosticPayload
): Promise<{ submissionId: string; status: string; message: string }> {
  const r = await fetch(`${API}/submit/${shareCode}/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });
  const body = await r.json();
  if (!r.ok) throw Object.assign(new Error(body.error || '제출 실패'), { statusCode: r.status });
  return body.data;
}
