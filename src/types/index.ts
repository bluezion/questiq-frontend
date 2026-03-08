// src/types/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// QuestIQ 전체 TypeScript 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════
//  교육학 이론 기반 타입
// ══════════════════════════════════════════════════════

/** Bloom's Revised Taxonomy 6단계 */
export type BloomLevel =
  | '기억' | '이해' | '적용' | '분석' | '평가' | '창의';

export type BloomLevelNum = 1 | 2 | 3 | 4 | 5 | 6;

/** Marzano 질문 연속체 4단계 */
export type MarzanoType =
  | 'detail' | 'category' | 'elaboration' | 'evidence';

/** 열린/닫힌 질문 분류 */
export type OpenClosedType = 'open' | 'closed';

/** 레벨 배지 */
export type LevelBadge =
  | '씨앗형' | '새싹형' | '꽃봉오리형' | '꽃형' | '열매형';

// ══════════════════════════════════════════════════════
//  API 요청 타입
// ══════════════════════════════════════════════════════

export interface ClassifyRequest {
  question: string;
  grade: Grade;
  subject: Subject;
  context?: string;
}

export interface BatchClassifyRequest {
  questions: Array<{
    question: string;
    grade: Grade;
    subject: Subject;
  }>;
}

export interface QftSessionRequest {
  session_id: string;
  questions: string[];
  grade: Grade;
  subject: Subject;
  qft_step?: 1 | 2 | 3 | 4 | 5;
}

// ══════════════════════════════════════════════════════
//  API 응답 타입
// ══════════════════════════════════════════════════════

export interface ClassifyResult {
  open_closed: OpenClosedType;
  open_closed_ko: string;
  open_closed_reason: string;
  bloom_level: BloomLevel;
  bloom_level_num: BloomLevelNum;
  bloom_emoji: string;
  bloom_reason: string;
  marzano_type: MarzanoType;
  marzano_type_ko: string;
  marzano_reason: string;
  score: number;           // 1~10
  level_badge: LevelBadge;
  level_badge_emoji: string;
  feedback: string;
  strengths: string[];
  improved_question: string;
  improvement_tip: string;
  next_bloom_suggestion: string;
  hint: string;
  qft_connection?: string;
  original_question: string;
  grade: Grade;
  subject: Subject;
  analyzed_at: string;
  request_id?: string;
}

export interface ClassifyApiResponse {
  success: boolean;
  data: ClassifyResult;
  meta: {
    request_id: string;
    model_used: string;
    tokens_used: number;
    elapsed_ms: number;
    fallback_used?: boolean;
  };
}

export interface BatchClassifyApiResponse {
  success: boolean;
  data: Array<ClassifyResult & { index: number }>;
  meta: {
    request_id: string;
    total: number;
    tokens_used: number;
    elapsed_ms: number;
  };
}

export interface QftStatistics {
  total_questions: number;
  open_count: number;
  closed_count: number;
  open_ratio: number;
  average_score: number;
  max_score: number;
  min_score: number;
  bloom_distribution: Record<string, number>;
  marzano_distribution: Record<string, number>;
  top_question: string;
  top_question_score: number;
}

export interface QftAnalysis {
  total_questions: number;
  open_count: number;
  closed_count: number;
  diversity_score: number;
  top_question: string;
  overall_feedback: string;
  suggestions: string[];
}

export interface QftSessionApiResponse {
  success: boolean;
  data: {
    session_id: string;
    questions: ClassifyResult[];
    qft_analysis: QftAnalysis;
    statistics: QftStatistics;
    qft_step: number;
    analyzed_at: string;
  };
}

// ══════════════════════════════════════════════════════
//  공통 도메인 타입
// ══════════════════════════════════════════════════════

export type Grade =
  | '초등 1학년' | '초등 2학년' | '초등 3학년'
  | '초등 4학년' | '초등 5학년' | '초등 6학년'
  | '중학 1학년' | '중학 2학년' | '중학 3학년'
  | '고등 1학년' | '고등 2학년' | '고등 3학년'
  | '기타';

export type Subject =
  | '국어' | '영어' | '수학' | '과학' | '사회' | '역사'
  | '도덕/윤리' | '음악' | '미술' | '체육' | '기술/가정'
  | '정보' | '한문' | '통합교과' | '일반' | '기타';

// ══════════════════════════════════════════════════════
//  API 에러 타입
// ══════════════════════════════════════════════════════

export interface ApiError {
  success: false;
  error: string;
  details?: Array<{ field: string; message: string }>;
  request_id?: string;
}

// ══════════════════════════════════════════════════════
//  훅 상태 타입
// ══════════════════════════════════════════════════════

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface UseClassifyState {
  result: ClassifyResult | null;
  loading: LoadingState;
  error: string | null;
  meta: ClassifyApiResponse['meta'] | null;
}

export interface UseQftSessionState {
  sessionId: string | null;
  questions: string[];
  results: ClassifyResult[];
  sessionResult: QftSessionApiResponse['data'] | null;
  loading: LoadingState;
  error: string | null;
  currentStep: number;
}

// ══════════════════════════════════════════════════════
//  로컬스토리지 히스토리 타입
// ══════════════════════════════════════════════════════

export interface QuestionHistory {
  id: string;
  question: string;
  grade: Grade;
  subject: Subject;
  result: ClassifyResult;
  timestamp: number;
}
