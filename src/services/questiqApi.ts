// src/services/questiqApi.ts
// ─────────────────────────────────────────────────────────────────────────────
// QuestIQ API 서비스 계층 - 백엔드와의 모든 통신 담당
// Axios 기반, 재시도 로직, 타임아웃, 에러 정규화 포함
// ─────────────────────────────────────────────────────────────────────────────
import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import type {
  ClassifyRequest,
  ClassifyApiResponse,
  BatchClassifyRequest,
  BatchClassifyApiResponse,
  QftSessionRequest,
  QftSessionApiResponse,
  ApiError,
  Grade,
  Subject,
} from '../types';

// ── 환경변수 기반 베이스 URL ──────────────────────────
// 우선순위:
//   1. 빌드 타임 주입: process.env.REACT_APP_API_URL (Dockerfile ARG)
//   2. 런타임 주입: window._env_.REACT_APP_API_URL (serve-entrypoint.sh 생성)
//   3. localhost fallback (개발 환경 전용)
declare global {
  interface Window { _env_?: Record<string, string>; }
}

const BASE_URL: string = (() => {
  const buildTime = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (buildTime && buildTime !== 'undefined' && buildTime.startsWith('http')) {
    return buildTime;
  }
  // 런타임 주입 (serve-entrypoint.sh 에서 env-config.js 동적 생성)
  const runtime = (window as Window)._env_?.REACT_APP_API_URL;
  if (runtime && runtime !== 'undefined' && runtime.startsWith('http')) {
    return runtime;
  }
  // 경고: API URL이 설정되지 않음
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[QuestIQ] ⚠ REACT_APP_API_URL이 설정되지 않았습니다.\n' +
      'Railway Variables 탭에서 REACT_APP_API_URL 을 설정하고 재배포하세요.\n' +
      '예) https://questiq-backend-production.up.railway.app'
    );
  }
  return 'http://localhost:3000';
})();

const API_PREFIX = '/api/v1';

// ══════════════════════════════════════════════════════
//  Axios 인스턴스 생성
// ══════════════════════════════════════════════════════
const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: 35_000,          // 35초 (GPT API 처리 시간 고려)
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false,
});

// ── 요청 인터셉터: 인증 토큰 주입 ────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('questiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 요청 추적 ID
    config.headers['X-Request-ID'] =
      `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── 응답 인터셉터: 에러 정규화 ────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const { response, config } = error;

    // 429 Too Many Requests → 3초 후 1회 재시도
    if (response?.status === 429 && config && !(config as any)._retried) {
      (config as any)._retried = true;
      await sleep(3000);
      return apiClient(config as AxiosRequestConfig);
    }

    // 에러 메시지 정규화
    const normalized = normalizeError(error);
    return Promise.reject(normalized);
  }
);

// ══════════════════════════════════════════════════════
//  API 함수 정의
// ══════════════════════════════════════════════════════

/**
 * 단일 질문 분류
 * POST /classify
 */
export async function classifyQuestion(
  payload: ClassifyRequest
): Promise<ClassifyApiResponse> {
  const { data } = await apiClient.post<ClassifyApiResponse>(
    '/classify',
    payload
  );
  return data;
}

/**
 * 배치 질문 분류 (최대 10개)
 * POST /classify/batch
 */
export async function classifyBatch(
  payload: BatchClassifyRequest
): Promise<BatchClassifyApiResponse> {
  const { data } = await apiClient.post<BatchClassifyApiResponse>(
    '/classify/batch',
    payload
  );
  return data;
}

/**
 * QFT 세션 전체 분석
 * POST /classify/qft
 */
export async function analyzeQftSession(
  payload: QftSessionRequest
): Promise<QftSessionApiResponse> {
  const { data } = await apiClient.post<QftSessionApiResponse>(
    '/classify/qft',
    payload
  );
  return data;
}

/**
 * 새 QFT 세션 ID 발급
 * GET /classify/session-id
 */
export async function getNewSessionId(): Promise<string> {
  const { data } = await apiClient.get<{ success: boolean; session_id: string }>(
    '/classify/session-id'
  );
  return data.session_id;
}

/**
 * 학년별 예시 질문 조회
 * GET /classify/examples
 */
export async function getExampleQuestions(): Promise<{
  elementary: { grade: string; examples: Array<{ question: string; bloom_level: string; score: number }> };
  middle: { grade: string; examples: Array<{ question: string; bloom_level: string; score: number }> };
  high: { grade: string; examples: Array<{ question: string; bloom_level: string; score: number }> };
}> {
  const { data } = await apiClient.get('/classify/examples');
  return data.data;
}

/**
 * 현재 설정된 API 베이스 URL 반환 (진단용)
 */
export function getApiBaseUrl(): string {
  return BASE_URL;
}

/**
 * 헬스체크
 * GET /health (루트 레벨)
 * - localhost 이고 프로덕션 환경이면 즉시 false 반환 (의미없는 요청 방지)
 */
export async function checkHealth(): Promise<boolean> {
  const isLocalhost = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1');
  if (isLocalhost && process.env.NODE_ENV === 'production') {
    return false;
  }
  try {
    // /health 엔드포인트 먼저 시도
    const { data } = await axios.get(`${BASE_URL}/health`, {
      timeout: 6000,
      headers: { Accept: 'application/json' },
    });
    // { status: 'ok' } 또는 { status: 'healthy' } 모두 허용
    return data?.status === 'ok' || data?.status === 'healthy' || data?.ok === true;
  } catch (e1) {
    // /health 실패 시 루트(/) 또는 /api/v1 에 GET 으로 fallback 확인
    try {
      const resp = await axios.get(`${BASE_URL}/api/v1`, {
        timeout: 6000,
        validateStatus: (s) => s < 500, // 4xx도 "서버가 살아있음"으로 간주
      });
      return resp.status < 500;
    } catch {
      return false;
    }
  }
}

// ══════════════════════════════════════════════════════
//  헬퍼 함수
// ══════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface NormalizedError {
  message: string;
  statusCode: number;
  details?: Array<{ field: string; message: string }>;
  isNetworkError: boolean;
  isTimeoutError: boolean;
  originalError?: unknown;
}

function normalizeError(error: AxiosError<ApiError>): NormalizedError {
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      message: 'AI 분석 시간이 초과되었습니다. 다시 시도해주세요.',
      statusCode: 504,
      isNetworkError: false,
      isTimeoutError: true,
    };
  }

  if (!error.response) {
    return {
      message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.',
      statusCode: 0,
      isNetworkError: true,
      isTimeoutError: false,
    };
  }

  const { status, data } = error.response;
  const statusMessages: Record<number, string> = {
    400: data?.error || '입력값을 확인해주세요.',
    401: '인증이 필요합니다.',
    403: '접근 권한이 없습니다.',
    429: 'AI 분류 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    500: '서버 오류가 발생했습니다.',
    503: 'AI 서비스를 일시적으로 사용할 수 없습니다.',
    504: '응답 시간이 초과되었습니다.',
  };

  return {
    message: statusMessages[status] || data?.error || '알 수 없는 오류가 발생했습니다.',
    statusCode: status,
    details: data?.details,
    isNetworkError: false,
    isTimeoutError: false,
    originalError: error,
  };
}

// ══════════════════════════════════════════════════════
//  상수
// ══════════════════════════════════════════════════════

export const GRADES: Grade[] = [
  '초등 1학년', '초등 2학년', '초등 3학년',
  '초등 4학년', '초등 5학년', '초등 6학년',
  '중학 1학년', '중학 2학년', '중학 3학년',
  '고등 1학년', '고등 2학년', '고등 3학년',
  '기타',
];

export const SUBJECTS: Subject[] = [
  '국어', '영어', '수학', '과학', '사회', '역사',
  '도덕/윤리', '음악', '미술', '체육', '기술/가정',
  '정보', '한문', '통합교과', '일반', '기타',
];

export const BLOOM_COLORS: Record<string, string> = {
  '기억': '#94a3b8', '이해': '#60a5fa', '적용': '#34d399',
  '분석': '#fbbf24', '평가': '#f97316', '창의': '#a78bfa',
};

export const BLOOM_BG_COLORS: Record<string, string> = {
  '기억': '#f1f5f9', '이해': '#eff6ff', '적용': '#f0fdf4',
  '분석': '#fffbeb', '평가': '#fff7ed', '창의': '#faf5ff',
};

export default apiClient;
