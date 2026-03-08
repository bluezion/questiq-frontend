// src/components/diagnostic/DiagnosticForm.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 25문항 리커트 설문 폼 컴포넌트
// - 구인별 섹션 분리, 진행 표시
// - 5점 리커트 (전혀 그렇지 않다 ~ 매우 그렇다)
// - 미답변 문항 시각적 강조
// - 소요 시간 타이머
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { DIAGNOSTIC_ITEMS, CONSTRUCTS } from '../../data/diagnosticData';
import type { LikertScore } from '../../types/diagnostic';
import type { AnswerMap } from '../../hooks/useDiagnostic';

interface DiagnosticFormProps {
  type: 'pre' | 'post';
  answers: AnswerMap;
  onAnswer: (itemId: string, score: LikertScore) => void;
  onSubmit: (startTime: number) => void;
  onCancel: () => void;
  progress: number;   // 0~100
}

const LIKERT_OPTIONS: { score: LikertScore; label: string; short: string; color: string }[] = [
  { score: 1, label: '전혀 그렇지 않다', short: '전혀', color: '#ef4444' },
  { score: 2, label: '그렇지 않다',       short: '아니다', color: '#f97316' },
  { score: 3, label: '보통이다',           short: '보통', color: '#94a3b8' },
  { score: 4, label: '그렇다',             short: '그렇다', color: '#10b981' },
  { score: 5, label: '매우 그렇다',        short: '매우', color: '#6366f1' },
];

const DiagnosticForm: React.FC<DiagnosticFormProps> = ({
  type, answers, onAnswer, onSubmit, onCancel, progress,
}) => {
  const [activeConstruct, setActiveConstruct] = useState(0);
  const [showUnfilled, setShowUnfilled] = useState(false);
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // 타이머
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const currentConstruct = CONSTRUCTS[activeConstruct];
  const currentItems = DIAGNOSTIC_ITEMS.filter(
    (i) => i.constructId === currentConstruct.id
  );
  const totalItems = DIAGNOSTIC_ITEMS.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalItems;

  // 현재 섹션 완료 여부
  const sectionComplete = currentItems.every((i) => answers[i.id] !== undefined);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleNext = () => {
    if (!sectionComplete) { setShowUnfilled(true); return; }
    setShowUnfilled(false);
    if (activeConstruct < CONSTRUCTS.length - 1) {
      setActiveConstruct((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setShowUnfilled(false);
    setActiveConstruct((p) => Math.max(0, p - 1));
  };

  const handleSubmit = () => {
    if (!allAnswered) { setShowUnfilled(true); return; }
    onSubmit(startTimeRef.current);
  };

  return (
    <div style={formStyles.wrapper}>
      {/* ── 헤더 ──────────────────────────────────── */}
      <div style={{
        ...formStyles.header,
        background: type === 'pre'
          ? 'linear-gradient(135deg,#3b82f6,#6366f1)'
          : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
      }}>
        <div>
          <div style={formStyles.headerTag}>
            {type === 'pre' ? '📋 사전 진단' : '📊 사후 진단'}
          </div>
          <h2 style={formStyles.headerTitle}>
            학생 질문 역량 자기진단 설문
          </h2>
          <p style={formStyles.headerSub}>
            솔직하게 답변할수록 더 정확한 진단 결과를 얻을 수 있어요.
          </p>
        </div>
        <div style={formStyles.timerBox}>
          <div style={formStyles.timerLabel}>⏱ 소요시간</div>
          <div style={formStyles.timerValue}>{formatTime(elapsed)}</div>
        </div>
      </div>

      {/* ── 전체 진행 바 ──────────────────────────── */}
      <div style={formStyles.progressSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
          <span>{answeredCount}/{totalItems} 문항 응답</span>
          <span style={{ fontWeight: 700, color: '#6366f1' }}>{progress}%</span>
        </div>
        <div style={formStyles.progressBg}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
            borderRadius: '6px',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* ── 구인 탭 ───────────────────────────────── */}
      <div style={formStyles.constructTabs}>
        {CONSTRUCTS.map((c, i) => {
          const items = DIAGNOSTIC_ITEMS.filter((it) => it.constructId === c.id);
          const done = items.every((it) => answers[it.id] !== undefined);
          return (
            <button
              key={c.id}
              onClick={() => setActiveConstruct(i)}
              style={{
                ...formStyles.constructTab,
                background: activeConstruct === i ? c.color : done ? '#f0fdf4' : '#f8fafc',
                color: activeConstruct === i ? '#fff' : done ? '#16a34a' : '#64748b',
                border: `2px solid ${activeConstruct === i ? c.color : done ? '#86efac' : '#e2e8f0'}`,
              }}
            >
              <span style={{ fontSize: '14px' }}>{c.emoji}</span>
              <span style={{ fontSize: '11px', fontWeight: activeConstruct === i ? 700 : 400 }}>
                {c.labelShort}
              </span>
              {done && activeConstruct !== i && (
                <span style={{ fontSize: '10px' }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 현재 구인 섹션 ─────────────────────────── */}
      <div style={formStyles.sectionCard}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '16px 20px',
          background: `${currentConstruct.color}10`,
          borderBottom: `2px solid ${currentConstruct.color}22`,
        }}>
          <span style={{ fontSize: '28px' }}>{currentConstruct.emoji}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: currentConstruct.color }}>
              {currentConstruct.label}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {currentConstruct.description}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>
            {activeConstruct + 1}/{CONSTRUCTS.length}
          </div>
        </div>

        {/* ── 리커트 범례 헤더 ─────────────────────── */}
        <div style={formStyles.likertHeader}>
          <span style={{ flex: 1, fontSize: '12px', color: '#94a3b8' }}>문항</span>
          <div style={formStyles.likertCols}>
            {LIKERT_OPTIONS.map((o) => (
              <div key={o.score} style={{ width: '48px', textAlign: 'center', fontSize: '11px', color: o.color, fontWeight: 700 }}>
                {o.short}
              </div>
            ))}
          </div>
        </div>

        {/* ── 문항 목록 ─────────────────────────────── */}
        {currentItems.map((item, idx) => {
          const answered = answers[item.id] !== undefined;
          const unfilled = showUnfilled && !answered;
          return (
            <div
              key={item.id}
              style={{
                ...formStyles.itemRow,
                background: unfilled ? '#fef2f2' : answered ? '#fafffe' : '#fff',
                borderBottom: idx < currentItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                outline: unfilled ? '2px solid #fca5a5' : 'none',
                borderRadius: unfilled ? '8px' : '0',
              }}
            >
              {/* 번호 + 문항 텍스트 */}
              <div style={formStyles.itemTextArea}>
                <span style={formStyles.itemNum}>{idx + 1}</span>
                <span style={{ fontSize: '14px', lineHeight: 1.6, color: '#1e293b' }}>
                  {item.text}
                </span>
                {unfilled && (
                  <span style={{ fontSize: '11px', color: '#ef4444', marginLeft: '6px' }}>
                    ← 응답 필요
                  </span>
                )}
              </div>

              {/* 리커트 버튼 */}
              <div style={formStyles.likertBtns}>
                {LIKERT_OPTIONS.map((opt) => {
                  const selected = answers[item.id] === opt.score;
                  return (
                    <button
                      key={opt.score}
                      onClick={() => onAnswer(item.id, opt.score)}
                      title={opt.label}
                      style={{
                        width: '48px', height: '44px',
                        border: selected
                          ? `2px solid ${opt.color}`
                          : '2px solid #e2e8f0',
                        borderRadius: '10px',
                        background: selected ? `${opt.color}15` : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      <span style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: selected ? opt.color : '#cbd5e1',
                      }}>
                        {opt.score}
                      </span>
                      {selected && (
                        <div style={{
                          width: '5px', height: '5px',
                          borderRadius: '50%',
                          background: opt.color,
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 미응답 경고 ────────────────────────────── */}
      {showUnfilled && !sectionComplete && (
        <div style={formStyles.warningBox}>
          ⚠ 이 섹션의 모든 문항에 응답해주세요.
        </div>
      )}

      {/* ── 하단 네비게이션 ────────────────────────── */}
      <div style={formStyles.footer}>
        <button onClick={onCancel} style={formStyles.cancelBtn}>✕ 취소</button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {activeConstruct > 0 && (
            <button onClick={handlePrev} style={formStyles.prevBtn}>← 이전</button>
          )}

          {activeConstruct < CONSTRUCTS.length - 1 ? (
            <button
              onClick={handleNext}
              style={{
                ...formStyles.nextBtn,
                background: sectionComplete
                  ? currentConstruct.color
                  : '#e2e8f0',
                color: sectionComplete ? '#fff' : '#94a3b8',
              }}
            >
              다음 →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              style={{
                ...formStyles.submitBtn,
                opacity: allAnswered ? 1 : 0.5,
                cursor: allAnswered ? 'pointer' : 'not-allowed',
              }}
            >
              {allAnswered ? '✅ 진단 완료' : `${totalItems - answeredCount}문항 남음`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const formStyles: Record<string, React.CSSProperties> = {
  wrapper: { background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' },
  header: { padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' },
  headerTag: { fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' },
  headerTitle: { fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 4px' },
  headerSub: { fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0 },
  timerBox: { background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px 16px', textAlign: 'center', flexShrink: 0 },
  timerLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 },
  timerValue: { fontSize: '20px', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' },
  progressSection: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9' },
  progressBg: { height: '8px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' },
  constructTabs: { display: 'flex', gap: '6px', padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid #f1f5f9' },
  constructTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', minWidth: '56px', fontFamily: "'Noto Sans KR', sans-serif" },
  sectionCard: { flex: 1 },
  likertHeader: { display: 'flex', alignItems: 'center', padding: '8px 20px', background: '#fafafa', borderBottom: '1px solid #f1f5f9' },
  likertCols: { display: 'flex', gap: '4px' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', transition: 'background 0.15s' },
  itemTextArea: { flex: 1, display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' },
  itemNum: { minWidth: '22px', height: '22px', borderRadius: '50%', background: '#ede9fe', color: '#5b21b6', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  likertBtns: { display: 'flex', gap: '4px', flexShrink: 0 },
  warningBox: { margin: '0 20px', padding: '12px', background: '#fef2f2', borderRadius: '10px', color: '#dc2626', fontSize: '13px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #f1f5f9', gap: '10px' },
  cancelBtn: { padding: '9px 16px', background: 'transparent', border: '1.5px solid #e2e8f0', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif" },
  prevBtn: { padding: '9px 20px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" },
  nextBtn: { padding: '9px 24px', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Noto Sans KR', sans-serif" },
  submitBtn: { padding: '10px 28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '14px', fontFamily: "'Noto Sans KR', sans-serif", transition: 'opacity 0.2s' },
};

export default DiagnosticForm;
