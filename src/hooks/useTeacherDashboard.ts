// src/hooks/useTeacherDashboard.ts
// ─────────────────────────────────────────────────────────────────────────────
// 교사 대시보드 상태 관리 훅 (v2 — MongoDB 백엔드 연동)
//
// 우선순위:
//   1. 백엔드 API 사용 (JWT 인증 필요)
//   2. 오프라인/미인증 → localStorage + 데모 데이터 폴백
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { StudentRecord, ClassStats, AiComment } from '../types/teacher';
import type { DiagnosticResult, DiagnosticComparison, ConstructId } from '../types/diagnostic';
import { CONSTRUCTS } from '../data/diagnosticData';
import {
  apiListStudents, apiCreateStudent, apiUpdateStudent, apiDeleteStudent,
  apiBulkDeleteStudents, apiSaveDiagnosticPre, apiSaveDiagnosticPost,
  apiSaveAiComment,
  tokenStore,
} from '../services/studentApiService';

const LOCAL_STORAGE_KEY = 'questiq_teacher_students';

// ══════════════════════════════════════════════════════
//  데모 학생 생성 유틸 (오프라인 폴백용)
// ══════════════════════════════════════════════════════
function makeDemoStudent(
  name: string, grade: string, group: string,
  preAvgs: number[], postAvgs: number[]
): StudentRecord {
  const makeResult = (type: 'pre' | 'post', avgs: number[]): DiagnosticResult => {
    const constructScores = CONSTRUCTS.map((c, i) => ({
      constructId: c.id as ConstructId,
      rawScores: Array(4).fill(Math.round(avgs[i])),
      averageScore: avgs[i],
      normalizedScore: Math.round(((avgs[i] - 1) / 4) * 100),
      level: (avgs[i] >= 4.2 ? 'very_high' : avgs[i] >= 3.4 ? 'high' : avgs[i] >= 2.6 ? 'medium' : 'low') as any,
    }));
    const totalAverage = avgs.reduce((a, b) => a + b, 0) / avgs.length;
    return {
      id: uuidv4(), type,
      constructScores,
      totalAverage: Math.round(totalAverage * 100) / 100,
      totalNormalized: Math.round(((totalAverage - 1) / 4) * 100),
      totalLevel: (totalAverage >= 4.2 ? 'very_high' : totalAverage >= 3.4 ? 'high' : totalAverage >= 2.6 ? 'medium' : 'low') as any,
      completedAt: new Date(Date.now() - (type === 'pre' ? 14 : 0) * 86400000).toISOString(),
    };
  };

  const pre  = makeResult('pre',  preAvgs);
  const post = makeResult('post', postAvgs);
  const constructComparisons = CONSTRUCTS.map((c, i) => ({
    constructId: c.id as ConstructId,
    preScore: preAvgs[i], postScore: postAvgs[i],
    improvement: Math.round((postAvgs[i] - preAvgs[i]) * 100) / 100,
    improvementPct: Math.round(((postAvgs[i] - preAvgs[i]) / preAvgs[i]) * 100),
    isSignificant: Math.abs(postAvgs[i] - preAvgs[i]) >= 0.5,
  }));
  const totalImprovement = Math.round((post.totalAverage - pre.totalAverage) * 100) / 100;
  const comparison: DiagnosticComparison = {
    pre, post, constructComparisons,
    totalImprovement,
    totalImprovementPct: Math.round((totalImprovement / pre.totalAverage) * 100),
    mostImprovedConstruct:  constructComparisons.reduce((a, b) => a.improvement > b.improvement ? a : b).constructId,
    leastImprovedConstruct: constructComparisons.reduce((a, b) => a.improvement < b.improvement ? a : b).constructId,
    overallGrowthLevel: totalImprovement >= 1.5 ? 'remarkable' : totalImprovement >= 0.8 ? 'significant' : totalImprovement >= 0.3 ? 'moderate' : totalImprovement >= 0 ? 'slight' : 'declined',
    summary: `${name} 학생의 질문 역량이 전체적으로 향상되었습니다.`,
  };
  return { id: uuidv4(), name, grade, group, pre, post, comparison, addedAt: new Date().toISOString() };
}

const DEMO_STUDENTS: StudentRecord[] = [
  makeDemoStudent('김민준', '중학교 2학년', '1모둠', [2.5,2.8,2.3,2.6,2.4,2.7], [3.8,4.1,3.5,3.7,3.9,3.6]),
  makeDemoStudent('이서연', '중학교 2학년', '1모둠', [3.2,3.0,3.5,3.1,2.9,3.3], [4.2,4.0,4.3,4.1,3.8,4.2]),
  makeDemoStudent('박지호', '중학교 2학년', '2모둠', [2.1,2.4,2.0,2.3,2.2,2.5], [3.0,3.3,2.8,3.2,3.1,3.4]),
  makeDemoStudent('최하은', '중학교 2학년', '2모둠', [3.8,3.6,3.9,3.7,3.5,3.8], [4.5,4.3,4.6,4.4,4.2,4.5]),
  makeDemoStudent('정도현', '중학교 2학년', '3모둠', [2.8,3.1,2.6,2.9,2.7,3.0], [3.4,3.7,3.2,3.6,3.3,3.8]),
  makeDemoStudent('윤수아', '중학교 2학년', '3모둠', [3.5,3.3,3.7,3.2,3.4,3.6], [3.8,3.6,4.0,3.5,3.7,3.9]),
  makeDemoStudent('강태민', '중학교 2학년', '4모둠', [2.3,2.6,2.2,2.5,2.1,2.4], [2.6,2.9,2.5,2.8,2.4,2.7]),
  makeDemoStudent('오유진', '중학교 2학년', '4모둠', [4.0,3.8,4.1,3.9,3.7,4.0], [4.6,4.4,4.7,4.5,4.3,4.6]),
];

// ── 로컬 폴백 읽기 ────────────────────────────────────
function loadLocalStudents(): StudentRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StudentRecord[];
  } catch { /* ignore */ }
  return DEMO_STUDENTS;
}

// ══════════════════════════════════════════════════════
//  훅 본체
// ══════════════════════════════════════════════════════
export interface UseTeacherDashboardReturn {
  students:      StudentRecord[];
  classStats:    ClassStats;
  isLoading:     boolean;
  isSynced:      boolean;   // true = 백엔드 연동 중
  syncError:     string | null;
  activeClassId: string | null;
  addStudent:    (data: { name: string; grade: string; group?: string; studentCode?: string; classId?: string }) => Promise<void>;
  updateStudent: (id: string, data: Partial<StudentRecord>) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  bulkRemove:    (ids: string[]) => Promise<void>;
  savePre:       (studentId: string, result: DiagnosticResult) => Promise<void>;
  savePost:      (studentId: string, result: DiagnosticResult) => Promise<void>;
  setAiComment:  (studentId: string, comment: AiComment) => Promise<void>;
  refresh:       (classId?: string | null) => Promise<void>;
  setActiveClassId: (id: string | null) => void;
  resetToDemo:   () => void;
}

export function useTeacherDashboard(): UseTeacherDashboardReturn {
  const [students, setStudents] = useState<StudentRecord[]>(loadLocalStudents);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced]   = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // ── 백엔드에서 학생 목록 로드 ─────────────────────
  const refresh = useCallback(async (classId?: string | null) => {
    if (!tokenStore.get()) return;   // 미인증 → 스킵
    setIsLoading(true);
    setSyncError(null);
    const cid = classId !== undefined ? classId : activeClassId;
    try {
      const params: Record<string, any> = { limit: 200 };
      if (cid) params.classId = cid;
      const { students: data } = await apiListStudents(params);
      setStudents(data);
      // 로컬에도 캐시
      try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data)); } catch {}
      setIsSynced(true);
    } catch (err: any) {
      setSyncError(err.message || '학생 데이터 로드 실패');
      // 폴백: 로컬 데이터 유지
    } finally {
      setIsLoading(false);
    }
  }, [activeClassId]);

  // 마운트 시 1회 로드 (토큰 있을 때)
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refresh();
  }, [refresh]);

  // ── 로컬 캐시 동기화 (오프라인 폴백) ─────────────
  useEffect(() => {
    if (!isSynced) return;  // 온라인 중에는 API가 소스
    try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students)); } catch {}
  }, [students, isSynced]);

  // ── CRUD ──────────────────────────────────────────
  const addStudent = useCallback(async (data: { name: string; grade: string; group?: string; studentCode?: string; classId?: string }) => {
    if (tokenStore.get()) {
      const created = await apiCreateStudent(data);
      setStudents(prev => [created, ...prev]);
    } else {
      // 오프라인 로컬 추가
      const local: StudentRecord = { ...data, id: uuidv4(), addedAt: new Date().toISOString() };
      setStudents(prev => [local, ...prev]);
    }
  }, []);

  const updateStudent = useCallback(async (id: string, data: Partial<StudentRecord>) => {
    if (tokenStore.get()) {
      const updated = await apiUpdateStudent(id, data as any);
      setStudents(prev => prev.map(s => s.id === id ? updated : s));
    } else {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    }
  }, []);

  const removeStudent = useCallback(async (id: string) => {
    if (tokenStore.get()) {
      await apiDeleteStudent(id);
    }
    setStudents(prev => prev.filter(s => s.id !== id));
  }, []);

  const bulkRemove = useCallback(async (ids: string[]) => {
    if (tokenStore.get()) {
      await apiBulkDeleteStudents(ids);
    }
    setStudents(prev => prev.filter(s => !ids.includes(s.id)));
  }, []);

  const savePre = useCallback(async (studentId: string, result: DiagnosticResult) => {
    if (tokenStore.get()) {
      const updated = await apiSaveDiagnosticPre(studentId, result);
      setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    } else {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, pre: result } : s));
    }
  }, []);

  const savePost = useCallback(async (studentId: string, result: DiagnosticResult) => {
    if (tokenStore.get()) {
      const updated = await apiSaveDiagnosticPost(studentId, result);
      setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    } else {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, post: result } : s));
    }
  }, []);

  const setAiComment = useCallback(async (studentId: string, comment: AiComment) => {
    if (tokenStore.get()) {
      const updated = await apiSaveAiComment(studentId, comment);
      setStudents(prev => prev.map(s => s.id === studentId ? updated : s));
    } else {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, aiComment: comment } : s));
    }
  }, []);

  const resetToDemo = useCallback(() => {
    setStudents(DEMO_STUDENTS);
    setIsSynced(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  // ── 클래스 통계 (memoized) ─────────────────────────
  const classStats = useMemo<ClassStats>(() => {
    const withBoth = students.filter(s => s.comparison);
    const withPre  = students.filter(s => s.pre);

    const constructAvgPre  = {} as Record<ConstructId, number>;
    const constructAvgPost = {} as Record<ConstructId, number>;
    CONSTRUCTS.forEach(c => {
      const preScores  = withBoth.map(s => s.pre?.constructScores.find(cs => cs.constructId === c.id)?.averageScore ?? 0);
      const postScores = withBoth.map(s => s.post?.constructScores.find(cs => cs.constructId === c.id)?.averageScore ?? 0);
      constructAvgPre[c.id as ConstructId]  = preScores.length  ? preScores.reduce((a,b)=>a+b,0)/preScores.length   : 0;
      constructAvgPost[c.id as ConstructId] = postScores.length ? postScores.reduce((a,b)=>a+b,0)/postScores.length : 0;
    });

    const improvements = CONSTRUCTS.map(c => ({
      id: c.id as ConstructId,
      diff: (constructAvgPost[c.id as ConstructId] ?? 0) - (constructAvgPre[c.id as ConstructId] ?? 0),
    }));
    const topImprovedConstruct = improvements.reduce((a, b) => a.diff > b.diff ? a : b).id;

    const avgPreTotal  = withBoth.length ? withBoth.reduce((a,s)=>a+(s.pre?.totalAverage??0),0)/withBoth.length  : 0;
    const avgPostTotal = withBoth.length ? withBoth.reduce((a,s)=>a+(s.post?.totalAverage??0),0)/withBoth.length : 0;

    return {
      totalStudents: students.length,
      completedBoth: withBoth.length,
      completedPre:  withPre.length,
      avgPreTotal:   Math.round(avgPreTotal  * 100) / 100,
      avgPostTotal:  Math.round(avgPostTotal * 100) / 100,
      avgImprovement: Math.round((avgPostTotal - avgPreTotal) * 100) / 100,
      constructAvgPre,
      constructAvgPost,
      topImprovedConstruct,
    };
  }, [students]);

  return {
    students, classStats, isLoading, isSynced, syncError,
    activeClassId, setActiveClassId,
    addStudent, updateStudent, removeStudent, bulkRemove,
    savePre, savePost, setAiComment, refresh, resetToDemo,
  };
}
