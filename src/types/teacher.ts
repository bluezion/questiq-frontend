// src/types/teacher.ts
// ─────────────────────────────────────────────────────────────────────────────
// 교사 대시보드 / 클래스 뷰 타입 정의
// ─────────────────────────────────────────────────────────────────────────────
import type { DiagnosticResult, DiagnosticComparison, ConstructId } from './diagnostic';

/** 학생 레코드 */
export interface StudentRecord {
  id: string;            // UUID
  name: string;
  grade: string;
  group?: string;        // 모둠/반
  pre?: DiagnosticResult;
  post?: DiagnosticResult;
  comparison?: DiagnosticComparison;
  addedAt: string;       // ISO
  aiComment?: AiComment; // 생성된 AI 코멘트
}

/** AI 맞춤 피드백 */
export interface AiComment {
  studentId: string;
  summary: string;         // 2-3줄 종합 요약
  strengths: string[];     // 강점 구인 설명
  improvements: string[];  // 개선 구인 설명
  nextSteps: string[];     // 권장 활동 3가지
  teacherTips: string[];   // 교사 지도 팁
  generatedAt: string;
  model: string;
  tokensUsed?: number;
}

/** 클래스 통계 */
export interface ClassStats {
  totalStudents: number;
  completedBoth: number;    // 사전+사후 완료
  completedPre: number;     // 사전만
  avgPreTotal: number;
  avgPostTotal: number;
  avgImprovement: number;
  constructAvgPre: Record<ConstructId, number>;
  constructAvgPost: Record<ConstructId, number>;
  topImprovedConstruct: ConstructId;
}

/** 대시보드 뷰 필터 */
export type DashboardView = 'grid' | 'table' | 'stats';
export type SortField = 'name' | 'improvement' | 'postScore' | 'addedAt';
export type SortDir   = 'asc' | 'desc';
