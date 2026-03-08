// src/hooks/useDiagnostic.ts
// ─────────────────────────────────────────────────────────────────────────────
// 사전-사후 진단 상태 관리 훅
// 설문 응답 처리 → 구인 점수 산출 → 비교 분석 → 로컬스토리지 영속
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  DIAGNOSTIC_ITEMS,
  CONSTRUCTS,
  getLevelInfo,
  getGrowthInfo,
} from '../data/diagnosticData';
import type {
  DiagnosticResult,
  DiagnosticComparison,
  ConstructScore,
  ConstructComparison,
  LikertScore,
  ConstructId,
  PerformanceLevel,
} from '../types/diagnostic';

// ── 로컬스토리지 키 ───────────────────────────────────
const STORAGE_KEY_PRE  = 'questiq_pre_diagnostic';
const STORAGE_KEY_POST = 'questiq_post_diagnostic';

// ── 응답 맵 타입 ──────────────────────────────────────
export type AnswerMap = Record<string, LikertScore>;

// ══════════════════════════════════════════════════════
//  핵심 계산 함수들 (순수 함수)
// ══════════════════════════════════════════════════════

/** 문항 응답 → 구인별 평균 점수 계산 */
function calcConstructScores(
  answers: AnswerMap,
  type: 'pre' | 'post',
  preCores?: ConstructScore[]
): ConstructScore[] {
  return CONSTRUCTS.map((c) => {
    const items = DIAGNOSTIC_ITEMS.filter((i) => i.constructId === c.id);
    const rawScores = items.map((item) => {
      const score = answers[item.id] ?? 3;
      // 역채점 문항 처리
      return item.reverseScored ? 6 - score : score;
    });
    const avg = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
    const normalized = Math.round(((avg - 1) / 4) * 100);
    const levelInfo = getLevelInfo(avg);
    const preAvg = preCores?.find((p) => p.constructId === c.id)?.averageScore;

    return {
      constructId: c.id as ConstructId,
      rawScores,
      averageScore: Math.round(avg * 100) / 100,
      normalizedScore: normalized,
      level: levelInfo.level as PerformanceLevel,
      improvement: type === 'post' && preAvg != null
        ? Math.round((avg - preAvg) * 100) / 100
        : undefined,
    };
  });
}

/** 전체 진단 결과 생성 */
function buildDiagnosticResult(
  answers: AnswerMap,
  type: 'pre' | 'post',
  preResult?: DiagnosticResult | null,
  startTime?: number
): DiagnosticResult {
  const constructScores = calcConstructScores(
    answers,
    type,
    preResult?.constructScores
  );
  const totalAvg =
    constructScores.reduce((a, c) => a + c.averageScore, 0) /
    constructScores.length;
  const totalNormalized = Math.round(((totalAvg - 1) / 4) * 100);
  const levelInfo = getLevelInfo(totalAvg);

  return {
    id: uuidv4(),
    type,
    constructScores,
    totalAverage: Math.round(totalAvg * 100) / 100,
    totalNormalized,
    totalLevel: levelInfo.level as PerformanceLevel,
    completedAt: new Date().toISOString(),
    durationSeconds: startTime
      ? Math.round((Date.now() - startTime) / 1000)
      : undefined,
  };
}

/** 사전-사후 비교 분석 생성 */
function buildComparison(
  pre: DiagnosticResult,
  post: DiagnosticResult
): DiagnosticComparison {
  const constructComparisons: ConstructComparison[] = CONSTRUCTS.map((c) => {
    const preScore =
      pre.constructScores.find((s) => s.constructId === c.id)?.averageScore ?? 0;
    const postScore =
      post.constructScores.find((s) => s.constructId === c.id)?.averageScore ?? 0;
    const improvement = Math.round((postScore - preScore) * 100) / 100;
    const improvementPct =
      preScore > 0 ? Math.round((improvement / preScore) * 100) : 0;

    return {
      constructId: c.id as ConstructId,
      preScore,
      postScore,
      improvement,
      improvementPct,
      isSignificant: Math.abs(improvement) >= 0.5,
    };
  });

  const totalImprovement =
    Math.round((post.totalAverage - pre.totalAverage) * 100) / 100;
  const totalImprovementPct =
    pre.totalAverage > 0
      ? Math.round((totalImprovement / pre.totalAverage) * 100)
      : 0;

  // 가장 많이/적게 향상된 구인
  const sorted = [...constructComparisons].sort(
    (a, b) => b.improvement - a.improvement
  );
  const mostImproved = sorted[0].constructId;
  const leastImproved = sorted[sorted.length - 1].constructId;

  const growthInfo = getGrowthInfo(totalImprovement);

  // 규칙 기반 요약 문장
  const summary = buildSummary(totalImprovement, mostImproved, growthInfo.label);

  return {
    pre,
    post,
    constructComparisons,
    totalImprovement,
    totalImprovementPct,
    mostImprovedConstruct: mostImproved,
    leastImprovedConstruct: leastImproved,
    overallGrowthLevel: growthInfo.level as any,
    summary,
  };
}

function buildSummary(
  improvement: number,
  mostImproved: ConstructId,
  growthLabel: string
): string {
  const constructLabels: Record<ConstructId, string> = {
    awareness: '질문 인식',
    generation: '질문 생성',
    refinement: '질문 정교화',
    classification: '질문 분류',
    inquiry: '질문 탐구',
    reflection: '질문 성찰',
  };
  const label = constructLabels[mostImproved];
  if (improvement <= 0)
    return `이번 프로그램을 통해 다양한 질문 역량을 경험했습니다. ${label} 영역을 중심으로 꾸준히 연습해보세요!`;
  return `${growthLabel}을 이뤘습니다! 특히 ${label} 영역에서 가장 큰 발전을 보였습니다. 이 성장을 바탕으로 계속 도전해보세요.`;
}

// ══════════════════════════════════════════════════════
//  훅 본체
// ══════════════════════════════════════════════════════

export interface UseDiagnosticReturn {
  preResult: DiagnosticResult | null;
  postResult: DiagnosticResult | null;
  comparison: DiagnosticComparison | null;

  // 설문 진행
  preAnswers: AnswerMap;
  postAnswers: AnswerMap;
  setPreAnswer: (itemId: string, score: LikertScore) => void;
  setPostAnswer: (itemId: string, score: LikertScore) => void;
  preProgress: number;   // 0~100 (%)
  postProgress: number;

  // 결과 처리
  submitPre: (startTime?: number) => void;
  submitPost: (startTime?: number) => void;
  resetAll: () => void;
  resetPost: () => void;

  // UI 상태
  activeForm: 'pre' | 'post' | null;
  setActiveForm: (f: 'pre' | 'post' | null) => void;
}

export function useDiagnostic(): UseDiagnosticReturn {
  // ── 영속 상태 (로컬스토리지 초기화) ──────────────
  const [preResult, setPreResult] = useState<DiagnosticResult | null>(() =>
    loadFromStorage(STORAGE_KEY_PRE)
  );
  const [postResult, setPostResult] = useState<DiagnosticResult | null>(() =>
    loadFromStorage(STORAGE_KEY_POST)
  );

  const [preAnswers, setPreAnswers] = useState<AnswerMap>({});
  const [postAnswers, setPostAnswers] = useState<AnswerMap>({});
  const [activeForm, setActiveForm] = useState<'pre' | 'post' | null>(null);

  // ── 비교 결과 (memoized) ───────────────────────────
  const comparison = useMemo<DiagnosticComparison | null>(() => {
    if (!preResult || !postResult) return null;
    return buildComparison(preResult, postResult);
  }, [preResult, postResult]);

  // ── 진행도 계산 ────────────────────────────────────
  const preProgress = useMemo(() => {
    const answered = Object.keys(preAnswers).length;
    return Math.round((answered / DIAGNOSTIC_ITEMS.length) * 100);
  }, [preAnswers]);

  const postProgress = useMemo(() => {
    const answered = Object.keys(postAnswers).length;
    return Math.round((answered / DIAGNOSTIC_ITEMS.length) * 100);
  }, [postAnswers]);

  // ── 응답 처리 ──────────────────────────────────────
  const setPreAnswer = useCallback((itemId: string, score: LikertScore) => {
    setPreAnswers((prev) => ({ ...prev, [itemId]: score }));
  }, []);

  const setPostAnswer = useCallback((itemId: string, score: LikertScore) => {
    setPostAnswers((prev) => ({ ...prev, [itemId]: score }));
  }, []);

  // ── 사전 진단 제출 ─────────────────────────────────
  const submitPre = useCallback((startTime?: number) => {
    const result = buildDiagnosticResult(preAnswers, 'pre', null, startTime);
    setPreResult(result);
    saveToStorage(STORAGE_KEY_PRE, result);
    setActiveForm(null);
  }, [preAnswers]);

  // ── 사후 진단 제출 ─────────────────────────────────
  const submitPost = useCallback((startTime?: number) => {
    const result = buildDiagnosticResult(postAnswers, 'post', preResult, startTime);
    setPostResult(result);
    saveToStorage(STORAGE_KEY_POST, result);
    setActiveForm(null);
  }, [postAnswers, preResult]);

  // ── 전체 초기화 ────────────────────────────────────
  const resetAll = useCallback(() => {
    setPreResult(null);
    setPostResult(null);
    setPreAnswers({});
    setPostAnswers({});
    setActiveForm(null);
    localStorage.removeItem(STORAGE_KEY_PRE);
    localStorage.removeItem(STORAGE_KEY_POST);
  }, []);

  // ── 사후만 초기화 ──────────────────────────────────
  const resetPost = useCallback(() => {
    setPostResult(null);
    setPostAnswers({});
    localStorage.removeItem(STORAGE_KEY_POST);
  }, []);

  return {
    preResult, postResult, comparison,
    preAnswers, postAnswers,
    setPreAnswer, setPostAnswer,
    preProgress, postProgress,
    submitPre, submitPost,
    resetAll, resetPost,
    activeForm, setActiveForm,
  };
}

// ── 로컬스토리지 헬퍼 ────────────────────────────────
function loadFromStorage(key: string): DiagnosticResult | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToStorage(key: string, data: DiagnosticResult): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
}
