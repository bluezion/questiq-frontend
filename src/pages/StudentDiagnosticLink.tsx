// src/pages/StudentDiagnosticLink.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 학생용 공유 링크 진단 페이지 (인증 불필요)
// URL: /?share=XXXXXXXX
//
// 흐름:
//   1) shareCode → 클래스 정보 로드
//   2) 학생 이름/진단 유형 선택
//   3) DiagnosticForm (25문항)
//   4) 결과 제출 → pending 상태 안내
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  apiGetPublicClassInfo, apiSubmitDiagnostic,
  type SubmitDiagnosticPayload,
} from '../services/classApiService';
import type { PublicClassInfo } from '../types/class';
import type { DiagnosticResult, ConstructId } from '../types/diagnostic';
import { useDiagnostic, type AnswerMap } from '../hooks/useDiagnostic';
import DiagnosticForm from '../components/diagnostic/DiagnosticForm';
import RadarChart from '../components/diagnostic/RadarChart';
import { CONSTRUCTS } from '../data/diagnosticData';
import type { RadarDataPoint } from '../types/diagnostic';

type Step = 'loading' | 'error' | 'name-input' | 'form' | 'submitting' | 'done';

interface Props {
  shareCode: string;
  onBack?: () => void;
}

export default function StudentDiagnosticLink({ shareCode, onBack }: Props) {
  const [step, setStep]             = useState<Step>('loading');
  const [classInfo, setClassInfo]   = useState<PublicClassInfo | null>(null);
  const [errMsg, setErrMsg]         = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [diagType, setDiagType]     = useState<'pre' | 'post'>('pre');
  const [submitResult, setSubmitResult] = useState<{ submissionId: string; message: string } | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const {
    preResult, postResult,
    preAnswers, postAnswers,
    setPreAnswer, setPostAnswer,
    preProgress, postProgress,
    submitPre, submitPost,
    activeForm, setActiveForm,
  } = useDiagnostic();

  // ── 클래스 정보 로드 ──────────────────────────────
  useEffect(() => {
    if (!shareCode) { setErrMsg('공유 코드가 없습니다.'); setStep('error'); return; }
    apiGetPublicClassInfo(shareCode)
      .then(info => {
        setClassInfo(info);
        // 링크 설정에 따라 진단 유형 자동 결정
        if (info.linkSettings.allowPre && !info.linkSettings.allowPost) setDiagType('pre');
        if (!info.linkSettings.allowPre && info.linkSettings.allowPost) setDiagType('post');
        setStep('name-input');
      })
      .catch(e => { setErrMsg(e.message || '유효하지 않은 링크입니다.'); setStep('error'); });
  }, [shareCode]);

  // ── 폼 제출 완료 감지 ─────────────────────────────
  const handleDiagnosticSubmit = useCallback((startTime: number) => {
    if (diagType === 'pre') submitPre(startTime);
    else submitPost(startTime);
    setActiveForm(null);
  }, [diagType, submitPre, submitPost, setActiveForm]);

  // preResult / postResult 변화 감지 → 서버 전송
  const resultToSubmit = diagType === 'pre' ? preResult : postResult;
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!resultToSubmit || step !== 'form' || submittingRef.current) return;
    submittingRef.current = true;
    setStep('submitting');

    const payload: SubmitDiagnosticPayload = {
      studentName:     studentName.trim(),
      studentCode:     studentCode.trim() || undefined,
      grade:           classInfo?.grade,
      constructScores: resultToSubmit.constructScores,
      totalAverage:    resultToSubmit.totalAverage,
      totalNormalized: resultToSubmit.totalNormalized,
      totalLevel:      resultToSubmit.totalLevel,
      durationSeconds: resultToSubmit.durationSeconds,
      fingerprint:     navigator.userAgent.slice(0, 50),
    };

    apiSubmitDiagnostic(shareCode, diagType, payload)
      .then(res => {
        setSubmitResult({ submissionId: res.submissionId, message: res.message });
        setStep('done');
      })
      .catch(e => { setErrMsg(e.message); setStep('error'); });
  }, [resultToSubmit, step, studentName, studentCode, classInfo, shareCode, diagType]);

  // ── 레이더 데이터 (완료 화면) ────────────────────
  const radarDataPoints: RadarDataPoint[] = CONSTRUCTS.map(c => {
    const score = resultToSubmit?.constructScores
      .find(s => s.constructId === (c.id as ConstructId))
      ?.normalizedScore ?? 0;
    return {
      constructId: c.id as ConstructId,
      label:        c.label,
      labelShort:   c.labelShort,
      emoji:        c.emoji,
      color:        c.color,
      lightColor:   c.lightColor,
      preScore:     score,
      postScore:    0,
    };
  });

  // ── 폼 시작 ──────────────────────────────────────
  const handleStartForm = () => {
    startTimeRef.current = Date.now();
    setActiveForm(diagType);
    setStep('form');
  };

  // ══════════════════════════════════════════════════
  //  렌더링
  // ══════════════════════════════════════════════════

  if (step === 'loading') return <FullScreen><Spinner text="링크를 확인하는 중..." /></FullScreen>;

  if (step === 'error') return (
    <FullScreen>
      <div style={sty.errorCard}>
        <div style={{ fontSize: 48 }}>😕</div>
        <h2 style={sty.errorTitle}>{errMsg}</h2>
        {onBack && <button style={sty.btn} onClick={onBack}>← 메인으로</button>}
      </div>
    </FullScreen>
  );

  if (step === 'submitting') return <FullScreen><Spinner text="결과를 제출하는 중..." /></FullScreen>;

  if (step === 'done' && submitResult) return (
    <FullScreen>
      <div style={sty.doneCard}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <h2 style={sty.doneTitle}>진단 제출 완료!</h2>
        <p style={sty.doneDesc}>{submitResult.message}</p>
        <div style={sty.doneInfo}>
          <span style={sty.doneLabel}>제출 ID</span>
          <code style={sty.doneCode}>{submitResult.submissionId.slice(-8).toUpperCase()}</code>
        </div>

        {/* 결과 레이더 차트 */}
        <div style={{ margin: '16px 0' }}>
          <RadarChart
            dataPoints={radarDataPoints}
            size={260}
            showLegend={false}
            animateOnMount
            showOnlyPre
          />
        </div>

        <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 1.7 }}>
          교사가 결과를 검토한 후 대시보드에 반영합니다.<br />
          이 화면을 캡처하거나 제출 ID를 기록해두세요.
        </p>
        {onBack && (
          <button style={sty.btn} onClick={onBack}>← 메인으로</button>
        )}
      </div>
    </FullScreen>
  );

  if (step === 'form' && activeForm) {
    const isPreForm = activeForm === 'pre';
    return (
      <div style={sty.formWrap}>
        {/* 진행 바 */}
        <div style={sty.progressBar}>
          <div style={{
            ...sty.progressFill,
            width: `${isPreForm ? preProgress : postProgress}%`,
          }} />
        </div>
        <DiagnosticForm
          type={activeForm}
          answers={isPreForm ? preAnswers : postAnswers}
          onAnswer={isPreForm ? setPreAnswer : setPostAnswer}
          onSubmit={handleDiagnosticSubmit}
          onCancel={() => { setActiveForm(null); setStep('name-input'); submittingRef.current = false; }}
          progress={isPreForm ? preProgress : postProgress}
        />
      </div>
    );
  }

  // name-input 단계
  const showBothTypes = classInfo?.linkSettings.allowPre && classInfo?.linkSettings.allowPost;

  return (
    <FullScreen>
      <div style={sty.card}>
        {/* 헤더 */}
        <div style={sty.classHeader}>
          <span style={sty.classIcon}>🏫</span>
          <div>
            <div style={sty.className}>{classInfo?.name}</div>
            <div style={sty.classMeta}>
              {[classInfo?.school, classInfo?.grade, classInfo?.subject].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>

        {/* 진단 유형 선택 (둘 다 허용 시만) */}
        {showBothTypes && (
          <>
            <p style={sty.sectionLabel}>진단 유형 선택</p>
            <div style={sty.typeRow}>
              {(['pre', 'post'] as const).map(t => (
                <button
                  key={t}
                  style={{ ...sty.typeBtn, ...(diagType === t ? sty.typeBtnActive : {}) }}
                  onClick={() => setDiagType(t)}
                >
                  {t === 'pre' ? '📋 사전 진단' : '📊 사후 진단'}
                </button>
              ))}
            </div>
          </>
        )}
        {!showBothTypes && (
          <div style={sty.singleTypeBadge}>
            {diagType === 'pre' ? '📋 사전 진단' : '📊 사후 진단'}
          </div>
        )}

        {/* 이름 입력 */}
        <p style={sty.sectionLabel}>이름 *</p>
        <input
          style={sty.input}
          type="text" placeholder="홍길동"
          value={studentName}
          onChange={e => setStudentName(e.target.value)}
          autoComplete="name"
        />

        {classInfo?.linkSettings.requireStudentId && (
          <>
            <p style={sty.sectionLabel}>학번 *</p>
            <input
              style={sty.input}
              type="text" placeholder="학번 입력"
              value={studentCode}
              onChange={e => setStudentCode(e.target.value)}
            />
          </>
        )}

        <button
          style={{
            ...sty.btn,
            ...(!studentName.trim() ? sty.btnDisabled : {}),
          }}
          disabled={!studentName.trim()}
          onClick={handleStartForm}
        >
          진단 시작하기 →
        </button>

        <p style={sty.hint}>⏱ 약 5~10분 소요 · 25개 문항 · 5점 척도</p>
      </div>
    </FullScreen>
  );
}

// ── 레이아웃 헬퍼 ─────────────────────────────────────
function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#f0f4ff,#faf5ff)', padding: 20,
    }}>
      {children}
    </div>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, border: '4px solid #e0e7ff', borderTopColor: '#6366f1',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
      }} />
      <p style={{ color: '#6366f1', fontWeight: 700 }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────
const sty: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff', borderRadius: 24, padding: '36px 32px',
    width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  classHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  classIcon:   { fontSize: 36 },
  className:   { fontSize: 20, fontWeight: 800, color: '#1e293b' },
  classMeta:   { fontSize: 13, color: '#64748b' },
  sectionLabel:{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 },
  typeRow:     { display: 'flex', gap: 8 },
  typeBtn:     {
    flex: 1, padding: '10px 0', borderRadius: 10, border: '2px solid #e5e7eb',
    background: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  typeBtnActive: {
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: '#fff', border: '2px solid transparent',
  },
  singleTypeBadge: {
    background: '#eef2ff', color: '#4338ca', borderRadius: 10,
    padding: '10px 16px', fontWeight: 700, fontSize: 14, textAlign: 'center',
  },
  input: {
    padding: '11px 14px', borderRadius: 10, border: '2px solid #e5e7eb',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
  },
  btn: {
    padding: '13px 0', borderRadius: 12,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: '#fff', fontWeight: 700, fontSize: 15, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', marginTop: 4,
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  hint: { textAlign: 'center', fontSize: 13, color: '#94a3b8', margin: 0 },
  formWrap: { minHeight: '100vh', background: '#f8fafc' },
  progressBar: { height: 4, background: '#e0e7ff' },
  progressFill: {
    height: 4, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
    transition: 'width .3s',
  },
  errorCard: {
    background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center',
    maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
  },
  errorTitle: { fontSize: 18, fontWeight: 700, color: '#dc2626' },
  doneCard: {
    background: '#fff', borderRadius: 24, padding: '36px 32px',
    width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
  },
  doneTitle: { fontSize: 24, fontWeight: 800, color: '#1e293b' },
  doneDesc:  { fontSize: 15, color: '#6b7280', lineHeight: 1.6 },
  doneInfo:  { display: 'flex', alignItems: 'center', gap: 8 },
  doneLabel: { fontSize: 13, color: '#94a3b8', fontWeight: 600 },
  doneCode:  {
    background: '#f1f5f9', padding: '4px 12px', borderRadius: 8,
    fontSize: 16, fontWeight: 700, color: '#6366f1', letterSpacing: 2,
  },
};
