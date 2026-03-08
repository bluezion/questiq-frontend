// src/types/class.ts
// ─────────────────────────────────────────────────────────────────────────────
// 클래스(학급) + 학생 진단 링크 + 제출 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

// ── 클래스 ──────────────────────────────────────────
export interface LinkSettings {
  isOpen:           boolean;
  allowPre:         boolean;
  allowPost:        boolean;
  requireName:      boolean;
  requireStudentId: boolean;
  expiresAt:        string | null;   // ISO
  maxSubmissions:   number | null;
}

export interface ClassRecord {
  id:          string;
  teacherId:   string;
  name:        string;
  school?:     string;
  grade?:      string;
  subject?:    string;
  year?:       number;
  description?:string;
  shareCode:   string;        // 8자리 코드 (예: A3F1C9B2)
  linkSettings: LinkSettings;
  statsCache?: {
    totalStudents:  number;
    completedPre:   number;
    completedPost:  number;
    avgImprovement: number;
    updatedAt:      string;
  };
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
}

// ── 진단 제출 ────────────────────────────────────────
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'merged';

export interface DiagnosticSubmission {
  id:             string;
  classId:        string;
  teacherId:      string;
  shareCode:      string;
  studentName:    string;
  studentCode?:   string;
  grade?:         string;
  diagnosticType: 'pre' | 'post';
  constructScores: Array<{
    constructId:     string;
    rawScores:       number[];
    averageScore:    number;
    normalizedScore: number;
    level:           string;
  }>;
  totalAverage:    number;
  totalNormalized: number;
  totalLevel:      string;
  durationSeconds?:number;
  status:         SubmissionStatus;
  studentId?:     string;
  submittedAt:    string;
  reviewedAt?:    string;
  reviewNote?:    string;
}

// ── 공유 링크용 공개 클래스 정보 ────────────────────
export interface PublicClassInfo {
  id:           string;
  name:         string;
  school?:      string;
  grade?:       string;
  subject?:     string;
  shareCode:    string;
  linkSettings: LinkSettings;
}

// ── 승인 결과 ─────────────────────────────────────────
export interface ApproveResult {
  submissionId: string;
  studentId:    string;
  status:       'merged';
}
