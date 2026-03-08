// src/hooks/useClassify.ts
// ─────────────────────────────────────────────────────────────────────────────
// 단일 질문 분류 훅 - 로딩 상태, 에러 처리, 히스토리 저장 통합
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useRef } from 'react';
import { classifyQuestion } from '../services/questiqApi';
import type {
  ClassifyRequest,
  ClassifyResult,
  LoadingState,
  QuestionHistory,
} from '../types';
import type { NormalizedError } from '../services/questiqApi';

const HISTORY_KEY = 'questiq_question_history';
const MAX_HISTORY = 50;

interface UseClassifyReturn {
  result: ClassifyResult | null;
  loading: LoadingState;
  error: string | null;
  tokensUsed: number;
  elapsedMs: number;
  classify: (payload: ClassifyRequest) => Promise<ClassifyResult | null>;
  reset: () => void;
  history: QuestionHistory[];
  clearHistory: () => void;
}

export function useClassify(): UseClassifyReturn {
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [history, setHistory] = useState<QuestionHistory[]>(() => loadHistory());

  // 요청 취소를 위한 AbortController
  const abortRef = useRef<AbortController | null>(null);

  const classify = useCallback(async (payload: ClassifyRequest): Promise<ClassifyResult | null> => {
    // 이전 요청 취소
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading('loading');
    setError(null);
    setResult(null);

    try {
      const response = await classifyQuestion(payload);

      if (!response.success) throw new Error('분류 실패');

      setResult(response.data);
      setTokensUsed(response.meta?.tokens_used ?? 0);
      setElapsedMs(response.meta?.elapsed_ms ?? 0);
      setLoading('success');

      // 히스토리 저장
      const entry: QuestionHistory = {
        id: `hist_${Date.now()}`,
        question: payload.question,
        grade: payload.grade,
        subject: payload.subject,
        result: response.data,
        timestamp: Date.now(),
      };
      setHistory((prev) => {
        const updated = [entry, ...prev].slice(0, MAX_HISTORY);
        saveHistory(updated);
        return updated;
      });

      return response.data;
    } catch (err: unknown) {
      const normalized = err as NormalizedError;
      const msg = normalized.message || '분류 중 오류가 발생했습니다.';
      setError(msg);
      setLoading('error');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setResult(null);
    setLoading('idle');
    setError(null);
    setTokensUsed(0);
    setElapsedMs(0);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return { result, loading, error, tokensUsed, elapsedMs, classify, reset, history, clearHistory };
}

// ── 로컬스토리지 헬퍼 ─────────────────────────────────
function loadHistory(): QuestionHistory[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as QuestionHistory[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: QuestionHistory[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // 스토리지 초과 시 무시
  }
}
