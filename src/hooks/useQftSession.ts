// src/hooks/useQftSession.ts
// ─────────────────────────────────────────────────────────────────────────────
// QFT 5단계 세션 관리 훅
// 질문 목록 관리 → 세션 ID 자동 발급 → 서버 전송 → 통계 수신
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useEffect } from 'react';
import { getNewSessionId, analyzeQftSession } from '../services/questiqApi';
import type {
  Grade,
  Subject,
  QftSessionApiResponse,
  LoadingState,
} from '../types';

interface UseQftSessionReturn {
  sessionId: string | null;
  questions: string[];
  currentStep: number;
  sessionResult: QftSessionApiResponse['data'] | null;
  loading: LoadingState;
  error: string | null;

  // 질문 관리
  addQuestion: (q: string) => void;
  removeQuestion: (index: number) => void;
  updateQuestion: (index: number, q: string) => void;
  clearQuestions: () => void;

  // 단계 관리
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // 세션 제출
  submitSession: (grade: Grade, subject: Subject, qftStep?: number) => Promise<void>;
  resetSession: () => Promise<void>;
}

export function useQftSession(): UseQftSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionResult, setSessionResult] = useState<QftSessionApiResponse['data'] | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 세션 ID 자동 발급
  useEffect(() => {
    getNewSessionId().then(setSessionId).catch(() => {
      setSessionId(`local_${Date.now()}`);
    });
  }, []);

  // 질문 관리
  const addQuestion = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestions((prev) => [...prev, trimmed]);
  }, []);

  const removeQuestion = useCallback((index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuestion = useCallback((index: number, q: string) => {
    setQuestions((prev) =>
      prev.map((item, i) => (i === index ? q : item))
    );
  }, []);

  const clearQuestions = useCallback(() => setQuestions([]), []);

  // 단계 관리
  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(5, step)));
  }, []);

  const nextStep = useCallback(() => setCurrentStep((s) => Math.min(5, s + 1)), []);
  const prevStep = useCallback(() => setCurrentStep((s) => Math.max(1, s - 1)), []);

  // 세션 제출
  const submitSession = useCallback(async (
    grade: Grade,
    subject: Subject,
    qftStep = currentStep
  ) => {
    if (!sessionId) {
      setError('세션 ID가 없습니다. 페이지를 새로고침 해주세요.');
      return;
    }
    if (questions.length < 3) {
      setError('QFT 분석을 위해 최소 3개의 질문이 필요합니다.');
      return;
    }

    setLoading('loading');
    setError(null);

    try {
      const response = await analyzeQftSession({
        session_id: sessionId,
        questions,
        grade,
        subject,
        qft_step: qftStep as 1 | 2 | 3 | 4 | 5,
      });

      if (!response.success) throw new Error('세션 분석 실패');

      setSessionResult(response.data);
      setLoading('success');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || '세션 분석 중 오류가 발생했습니다.';
      setError(msg);
      setLoading('error');
    }
  }, [sessionId, questions, currentStep]);

  // 세션 초기화 (새 세션 ID 발급)
  const resetSession = useCallback(async () => {
    setQuestions([]);
    setCurrentStep(1);
    setSessionResult(null);
    setLoading('idle');
    setError(null);
    try {
      const newId = await getNewSessionId();
      setSessionId(newId);
    } catch {
      setSessionId(`local_${Date.now()}`);
    }
  }, []);

  return {
    sessionId, questions, currentStep, sessionResult, loading, error,
    addQuestion, removeQuestion, updateQuestion, clearQuestions,
    goToStep, nextStep, prevStep,
    submitSession, resetSession,
  };
}
