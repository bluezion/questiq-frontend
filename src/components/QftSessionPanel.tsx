// src/components/QftSessionPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// QFT 5단계 세션 패널 컴포넌트
// 단계별 안내, 질문 목록 입력, 세션 분석 제출, 결과 요약 표시
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef } from 'react';
import { useQftSession } from '../hooks/useQftSession';
import { GRADES, SUBJECTS } from '../services/questiqApi';
import type { Grade, Subject } from '../types';
import { BLOOM_PALETTE, OPEN_CLOSED_STYLE, scoreToColor } from '../utils';

// QFT 5단계 정의
const QFT_STEPS = [
  {
    step: 1,
    icon: '📌',
    title: 'QFocus 제시',
    desc: '선생님이 주제(QFocus)를 제시합니다.',
    hint: '제시된 주제를 보고 자유롭게 질문을 떠올려 보세요.',
    color: '#6366f1',
  },
  {
    step: 2,
    icon: '💬',
    title: '질문 폭발 (3분)',
    desc: '판단 없이 최대한 많은 질문을 만드세요.',
    hint: '좋고 나쁜 질문은 없어요. 떠오르는 것을 모두 적어보세요!',
    color: '#10b981',
  },
  {
    step: 3,
    icon: '🔄',
    title: '열린/닫힌 질문 분류',
    desc: '각 질문이 열린 질문인지 닫힌 질문인지 구분해보세요.',
    hint: '"예/아니오"로 답할 수 있으면 닫힌 질문, 다양한 답이 가능하면 열린 질문이에요.',
    color: '#f59e0b',
  },
  {
    step: 4,
    icon: '⭐',
    title: '우선순위 선정',
    desc: '가장 중요한 질문 3개를 선택하고 이유를 적어보세요.',
    hint: '탐구하고 싶은, 또는 가장 어려운 질문을 골라보세요.',
    color: '#f97316',
  },
  {
    step: 5,
    icon: '💭',
    title: '성찰',
    desc: '이번 활동에서 무엇을 배웠나요?',
    hint: '새롭게 발견한 질문이나 떠오른 생각을 정리해보세요.',
    color: '#8b5cf6',
  },
];

interface QftSessionPanelProps {
  qFocusTopic?: string;
  defaultGrade?: Grade;
  defaultSubject?: Subject;
}

const QftSessionPanel: React.FC<QftSessionPanelProps> = ({
  qFocusTopic = '우리 주변의 환경 문제',
  defaultGrade = '기타',
  defaultSubject = '일반',
}) => {
  const {
    sessionId, questions, currentStep, sessionResult, loading, error,
    addQuestion, removeQuestion, updateQuestion,
    goToStep, nextStep, prevStep,
    submitSession, resetSession,
  } = useQftSession();

  const [grade, setGrade] = useState<Grade>(defaultGrade);
  const [subject, setSubject] = useState<Subject>(defaultSubject);
  const [inputValue, setInputValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const stepInfo = QFT_STEPS[currentStep - 1];

  const handleAddQuestion = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    addQuestion(trimmed);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddQuestion(); }
  };

  const handleEditSave = (index: number) => {
    updateQuestion(index, editValue.trim());
    setEditingIndex(null);
  };

  const handleSubmit = () => {
    submitSession(grade, subject, currentStep);
    goToStep(5);
  };

  // ── 결과 화면 ───────────────────────────────────────
  if (sessionResult) {
    return <QftResultView result={sessionResult} onReset={resetSession} />;
  }

  return (
    <div style={panelStyles.wrapper}>
      {/* ── 세션 헤더 ─────────────────────────────── */}
      <div style={panelStyles.header}>
        <div>
          <h2 style={panelStyles.headerTitle}>🎯 QFT 질문 만들기 세션</h2>
          <div style={panelStyles.sessionId}>세션 ID: {sessionId?.slice(0, 8) ?? '…'}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={grade} onChange={e => setGrade(e.target.value as Grade)} style={panelStyles.miniSelect}>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={subject} onChange={e => setSubject(e.target.value as Subject)} style={panelStyles.miniSelect}>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── 단계 진행 표시 ────────────────────────── */}
      <div style={panelStyles.stepTrack}>
        {QFT_STEPS.map(({ step, icon, title, color }) => (
          <button
            key={step}
            onClick={() => goToStep(step)}
            style={{
              ...panelStyles.stepBtn,
              background: currentStep === step ? color : currentStep > step ? `${color}22` : '#f8fafc',
              color: currentStep === step ? '#fff' : currentStep > step ? color : '#94a3b8',
              border: `2px solid ${currentStep >= step ? color : '#e2e8f0'}`,
              transform: currentStep === step ? 'scale(1.05)' : 'scale(1)',
            }}
            title={title}
          >
            <span>{icon}</span>
            <span style={{ fontSize: '11px', fontWeight: currentStep === step ? 700 : 400 }}>
              {step}단계
            </span>
          </button>
        ))}
      </div>

      {/* ── 진행 바 ───────────────────────────────── */}
      <div style={panelStyles.progressBar}>
        <div style={{
          width: `${(currentStep / 5) * 100}%`,
          height: '100%',
          background: `linear-gradient(90deg, #6366f1, ${stepInfo.color})`,
          borderRadius: '4px',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* ── 현재 단계 카드 ────────────────────────── */}
      <div style={{
        ...panelStyles.stepCard,
        borderLeft: `4px solid ${stepInfo.color}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>{stepInfo.icon}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: stepInfo.color }}>
              {stepInfo.step}단계: {stepInfo.title}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{stepInfo.desc}</div>
          </div>
        </div>
        <div style={panelStyles.hintBox}>
          💡 {stepInfo.hint}
        </div>

        {/* QFocus 주제 표시 */}
        <div style={panelStyles.qFocusBox}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
            📍 QFocus
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#4c1d95' }}>
            {qFocusTopic}
          </span>
        </div>
      </div>

      {/* ── 질문 입력 영역 ─────────────────────────── */}
      <div style={panelStyles.inputArea}>
        <div style={panelStyles.inputRow}>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하고 Enter를 누르세요..."
            style={panelStyles.input}
            disabled={loading === 'loading'}
          />
          <button
            onClick={handleAddQuestion}
            style={{
              ...panelStyles.addBtn,
              background: inputValue.trim() ? stepInfo.color : '#e2e8f0',
              color: inputValue.trim() ? '#fff' : '#94a3b8',
            }}
            disabled={!inputValue.trim() || loading === 'loading'}
          >
            + 추가
          </button>
        </div>

        {/* 질문 카운터 */}
        <div style={panelStyles.counter}>
          질문 {questions.length}개 입력됨
          {questions.length < 3 && (
            <span style={{ color: '#ef4444', marginLeft: '6px' }}>
              (최소 3개 필요)
            </span>
          )}
        </div>
      </div>

      {/* ── 질문 목록 ─────────────────────────────── */}
      {questions.length > 0 && (
        <div style={panelStyles.questionList}>
          {questions.map((q, i) => (
            <div key={i} style={panelStyles.questionItem}>
              <span style={panelStyles.questionNum}>{i + 1}</span>
              {editingIndex === i ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleEditSave(i)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditSave(i)}
                  style={panelStyles.editInput}
                  autoFocus
                />
              ) : (
                <span
                  style={panelStyles.questionText}
                  onClick={() => { setEditingIndex(i); setEditValue(q); }}
                  title="클릭하여 수정"
                >
                  {q}
                </span>
              )}
              <button
                onClick={() => removeQuestion(i)}
                style={panelStyles.removeBtn}
                title="삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── 에러 ──────────────────────────────────── */}
      {error && (
        <div style={panelStyles.errorBox}>
          ⚠ {error}
        </div>
      )}

      {/* ── 하단 버튼 ─────────────────────────────── */}
      <div style={panelStyles.footer}>
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          style={{ ...panelStyles.navBtn, opacity: currentStep === 1 ? 0.4 : 1 }}
        >
          ← 이전
        </button>

        {currentStep < 5 ? (
          <button onClick={nextStep} style={{...panelStyles.navBtn, background: '#ede9fe', color: '#5b21b6'}}>
            다음 →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={questions.length < 3 || loading === 'loading'}
            style={{
              ...panelStyles.submitBtn,
              opacity: questions.length < 3 ? 0.5 : 1,
              cursor: questions.length < 3 ? 'not-allowed' : 'pointer',
            }}
          >
            {loading === 'loading' ? '🤖 AI 분석 중...' : '🚀 AI로 세션 분석하기'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── QFT 세션 결과 뷰 컴포넌트 ────────────────────────
const QftResultView: React.FC<{
  result: any;
  onReset: () => void;
}> = ({ result, onReset }) => {
  const { statistics: stats, qft_analysis: analysis } = result;

  return (
    <div style={panelStyles.wrapper}>
      {/* 헤더 */}
      <div style={{ ...panelStyles.header, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '16px', color: '#fff' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>🏆 QFT 세션 분석 완료</h2>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
            총 {stats.total_questions}개 질문 분석 완료
          </div>
        </div>
        <button onClick={onReset} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif" }}>
          🔄 새 세션
        </button>
      </div>

      {/* 핵심 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '20px' }}>
        {[
          { label: '총 질문', value: stats.total_questions, unit: '개', color: '#6366f1' },
          { label: '열린 질문', value: `${stats.open_ratio}%`, unit: '', color: '#10b981' },
          { label: '평균 점수', value: stats.average_score, unit: '점', color: '#f59e0b' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{ background: '#fafafa', borderRadius: '12px', padding: '16px', textAlign: 'center', border: `2px solid ${color}22` }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color }}>{value}{unit}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Bloom 분포 */}
      {stats.bloom_distribution && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
            Bloom 분포
          </div>
          {Object.entries(stats.bloom_distribution).map(([level, count]) => {
            const palette = BLOOM_PALETTE[level as keyof typeof BLOOM_PALETTE] ?? BLOOM_PALETTE['기억'];
            const pct = Math.round(((count as number) / stats.total_questions) * 100);
            return (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ width: '40px', fontSize: '12px', color: palette.text, fontWeight: 600 }}>{level}</span>
                <div style={{ flex: 1, height: '14px', background: '#f1f5f9', borderRadius: '7px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: palette.bar, borderRadius: '7px', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8', width: '32px', textAlign: 'right' }}>{count as number}개</span>
              </div>
            );
          })}
        </div>
      )}

      {/* AI 피드백 */}
      {analysis?.overall_feedback && (
        <div style={{ margin: '0 20px 20px', padding: '16px', background: '#f0f9ff', borderRadius: '12px', borderLeft: '4px solid #0ea5e9' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0c4a6e', marginBottom: '8px' }}>🤖 AI 종합 피드백</div>
          <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#0c4a6e', margin: 0 }}>{analysis.overall_feedback}</p>
          {analysis.suggestions?.length > 0 && (
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              {analysis.suggestions.map((s: string, i: number) => (
                <li key={i} style={{ fontSize: '13px', color: '#0369a1', marginBottom: '4px' }}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 베스트 질문 */}
      {stats.top_question && (
        <div style={{ margin: '0 20px 20px', padding: '16px', background: '#faf5ff', borderRadius: '12px', border: '2px solid #c4b5fd' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#5b21b6', textTransform: 'uppercase', marginBottom: '6px' }}>🌟 Best Question ({stats.top_question_score}점)</div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#4c1d95', margin: 0 }}>"{stats.top_question}"</p>
        </div>
      )}
    </div>
  );
};

// ── 스타일 ─────────────────────────────────────────────
const panelStyles: Record<string, React.CSSProperties> = {
  wrapper: { background: '#fff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0' },
  header: { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', gap: '12px', flexWrap: 'wrap' },
  headerTitle: { fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 },
  sessionId: { fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' },
  miniSelect: { padding: '6px 10px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#475569', fontFamily: "'Noto Sans KR', sans-serif", cursor: 'pointer' },
  stepTrack: { display: 'flex', gap: '6px', padding: '16px 20px 8px', overflowX: 'auto' },
  stepBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', minWidth: '62px', fontFamily: "'Noto Sans KR', sans-serif', fontSize: '18px" },
  progressBar: { height: '4px', background: '#f1f5f9', margin: '0 20px 16px' },
  stepCard: { margin: '0 20px 16px', padding: '16px', background: '#fafafa', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
  hintBox: { fontSize: '13px', color: '#64748b', background: '#fff', padding: '8px 12px', borderRadius: '8px', lineHeight: 1.6 },
  qFocusBox: { background: '#faf5ff', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1.5px solid #e9d5ff' },
  inputArea: { padding: '0 20px 12px' },
  inputRow: { display: 'flex', gap: '8px' },
  input: { flex: 1, padding: '11px 14px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", color: '#1e293b', background: '#fafafa' },
  addBtn: { padding: '11px 18px', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s', fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: 'nowrap' },
  counter: { fontSize: '12px', color: '#94a3b8', marginTop: '6px', textAlign: 'right' },
  questionList: { margin: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' },
  questionItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' },
  questionNum: { width: '24px', height: '24px', background: '#ede9fe', color: '#5b21b6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 },
  questionText: { flex: 1, fontSize: '14px', color: '#1e293b', cursor: 'pointer', lineHeight: 1.5 },
  editInput: { flex: 1, padding: '4px 8px', fontSize: '14px', border: '1.5px solid #6366f1', borderRadius: '6px', outline: 'none', fontFamily: "'Noto Sans KR', sans-serif" },
  removeBtn: { padding: '4px 8px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', opacity: 0.6, borderRadius: '6px' },
  errorBox: { margin: '0 20px', padding: '12px 16px', background: '#fef2f2', borderRadius: '10px', color: '#dc2626', fontSize: '14px' },
  footer: { display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #f1f5f9', gap: '10px' },
  navBtn: { padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s' },
  submitBtn: { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" },
};

export default QftSessionPanel;
