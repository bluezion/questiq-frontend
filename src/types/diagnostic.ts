// src/types/diagnostic.ts
// ─────────────────────────────────────────────────────────────────────────────
// KCI 논문 기반 학생 질문 능력 자기진단 평가도구 타입 정의
// 출처: "학생 질문 능력의 자기진단 평가도구 개발 및 타당화"
//       (KCI, ART003161879) — 6구인 25문항, 표본 11,164명
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════
//  6구인(Construct) 정의
// ══════════════════════════════════════════════════════

/** 6개의 질문 역량 구인 ID */
export type ConstructId =
  | 'awareness'     // 질문 인식
  | 'generation'    // 질문 생성
  | 'refinement'    // 질문 정교화
  | 'classification'// 질문 분류
  | 'inquiry'       // 질문 탐구
  | 'reflection';   // 질문 성찰

/** 하나의 구인(Construct) 메타데이터 */
export interface ConstructMeta {
  id: ConstructId;
  label: string;          // 한글 레이블
  labelShort: string;     // 짧은 레이블 (레이더 차트 축 표기용)
  description: string;    // 설명
  emoji: string;
  color: string;          // 대표 색상 (hex)
  lightColor: string;     // 연한 색상
}

/** 5점 리커트 척도 */
export type LikertScore = 1 | 2 | 3 | 4 | 5;

/** 진단 항목(문항) */
export interface DiagnosticItem {
  id: string;             // 예: 'aw_01'
  constructId: ConstructId;
  text: string;           // 문항 내용
  reverseScored?: boolean;// 역채점 문항 여부
}

// ══════════════════════════════════════════════════════
//  진단 결과 타입
// ══════════════════════════════════════════════════════

/** 단일 구인의 점수 결과 */
export interface ConstructScore {
  constructId: ConstructId;
  rawScores: number[];      // 문항별 원점수 배열
  averageScore: number;     // 구인 평균 (1~5)
  normalizedScore: number;  // 100점 환산 (0~100)
  level: PerformanceLevel;  // 수준 판정
  improvement?: number;     // 사후 - 사전 차이 (사후 시에만 존재)
}

/** 수준 판정 */
export type PerformanceLevel =
  | 'very_low'    // 1.0~1.8: 씨앗 단계
  | 'low'         // 1.8~2.6: 새싹 단계
  | 'medium'      // 2.6~3.4: 성장 단계
  | 'high'        // 3.4~4.2: 개화 단계
  | 'very_high';  // 4.2~5.0: 열매 단계

/** 전체 진단 결과 */
export interface DiagnosticResult {
  id: string;                           // UUID
  type: 'pre' | 'post';                 // 사전/사후
  studentId?: string;
  grade?: string;
  subject?: string;
  constructScores: ConstructScore[];    // 6개 구인 점수
  totalAverage: number;                 // 전체 평균 (1~5)
  totalNormalized: number;              // 전체 100점 환산
  totalLevel: PerformanceLevel;
  completedAt: string;                  // ISO timestamp
  durationSeconds?: number;             // 소요 시간(초)
}

/** 사전-사후 비교 분석 결과 */
export interface DiagnosticComparison {
  pre: DiagnosticResult;
  post: DiagnosticResult;
  constructComparisons: ConstructComparison[];
  totalImprovement: number;             // 전체 향상 점수
  totalImprovementPct: number;          // 향상률 (%)
  mostImprovedConstruct: ConstructId;
  leastImprovedConstruct: ConstructId;
  overallGrowthLevel: GrowthLevel;
  summary: string;                      // AI 또는 규칙 기반 요약
}

/** 구인별 비교 */
export interface ConstructComparison {
  constructId: ConstructId;
  preScore: number;
  postScore: number;
  improvement: number;
  improvementPct: number;
  isSignificant: boolean;   // |improvement| >= 0.5 이면 유의미
}

/** 성장 등급 */
export type GrowthLevel =
  | 'remarkable'  // 1.5+ 향상: 눈부신 성장
  | 'significant' // 0.8~1.5: 뚜렷한 성장
  | 'moderate'    // 0.3~0.8: 꾸준한 성장
  | 'slight'      // 0~0.3:   미미한 성장
  | 'declined';   // < 0:     다시 도전

// ══════════════════════════════════════════════════════
//  레이더 차트 Props 타입
// ══════════════════════════════════════════════════════

export interface RadarDataPoint {
  constructId: ConstructId;
  label: string;
  labelShort: string;
  emoji: string;
  color: string;
  lightColor: string;
  preScore: number;   // 0~100 정규화 점수
  postScore: number;
}

// ══════════════════════════════════════════════════════
//  훅 상태 타입
// ══════════════════════════════════════════════════════

export interface UseDiagnosticState {
  preResult: DiagnosticResult | null;
  postResult: DiagnosticResult | null;
  comparison: DiagnosticComparison | null;
  activeForm: 'pre' | 'post' | null;
  isLoading: boolean;
}
