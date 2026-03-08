// src/components/QuestionInput.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 질문 입력 폼 컴포넌트
// - 질문 텍스트, 학년, 교과 선택
// - 글자 수 카운터, 실시간 유효성 검사
// - 예시 질문 버튼 (단계별로 다른 힌트)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { GRADES, SUBJECTS } from '../services/questiqApi';
import type { Grade, Subject } from '../types';

interface QuestionInputProps {
  onSubmit: (question: string, grade: Grade, subject: Subject) => void;
  loading?: boolean;
  placeholder?: string;
  defaultGrade?: Grade;
  defaultSubject?: Subject;
  showExamples?: boolean;
  label?: string;
}

const EXAMPLE_QUESTIONS: Record<string, string[]> = {
  elementary: [
    '물은 왜 0도에서 얼까요?',
    '씨앗이 자라려면 무엇이 필요할까요?',
    '지구가 둥근 이유는 무엇인가요?',
  ],
  middle: [
    '산업혁명이 사람들의 생활을 어떻게 바꿨을까요?',
    '민주주의가 없다면 우리 사회는 어떻게 될까요?',
    '기후변화와 경제성장은 공존할 수 있을까요?',
  ],
  high: [
    '인터넷이 없어진다면 민주주의는 어떻게 변할까요?',
    '인공지능이 인간의 창의성을 대체할 수 있을까요?',
    '역사는 반복된다는 말은 얼마나 타당한가요?',
  ],
};

const MAX_LENGTH = 500;

const QuestionInput: React.FC<QuestionInputProps> = ({
  onSubmit,
  loading = false,
  placeholder = '질문을 입력해주세요. 예: 왜 산업화는 환경 문제를 일으켰나요?',
  defaultGrade = '기타',
  defaultSubject = '일반',
  showExamples = true,
  label = '질문 입력',
}) => {
  const [question, setQuestion] = useState('');
  const [grade, setGrade] = useState<Grade>(defaultGrade);
  const [subject, setSubject] = useState<Subject>(defaultSubject);
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isValid = question.trim().length >= 3;
  const showError = touched && !isValid;

  // Ctrl+Enter 제출
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [question, grade, subject]); // eslint-disable-line

  const handleSubmit = () => {
    setTouched(true);
    if (!isValid || loading) return;
    onSubmit(question.trim(), grade, subject);
  };

  const handleExampleClick = (q: string) => {
    setQuestion(q);
    textareaRef.current?.focus();
  };

  const getExampleGroup = () => {
    if (grade.startsWith('초등')) return 'elementary';
    if (grade.startsWith('중학')) return 'middle';
    return 'high';
  };

  const examples = EXAMPLE_QUESTIONS[getExampleGroup()];
  const charCount = question.length;
  const charRatio = charCount / MAX_LENGTH;

  return (
    <div style={styles.container}>
      <label style={styles.label}>{label}</label>

      {/* 텍스트 입력 영역 */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, MAX_LENGTH))}
          onBlur={() => setTouched(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={4}
          style={{
            ...styles.textarea,
            borderColor: showError ? '#ef4444' : question.length > 0 ? '#6366f1' : '#e2e8f0',
            boxShadow: question.length > 0 ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
          }}
          disabled={loading}
          aria-label="질문 입력 텍스트"
          aria-invalid={showError}
        />

        {/* 글자 수 카운터 */}
        <div style={{
          ...styles.charCount,
          color: charRatio > 0.9 ? '#ef4444' : charRatio > 0.7 ? '#f97316' : '#94a3b8',
        }}>
          {charCount}/{MAX_LENGTH}
        </div>

        {/* Ctrl+Enter 힌트 */}
        {question.length > 0 && (
          <div style={styles.shortcutHint}>
            <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Enter</kbd>로 제출
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {showError && (
        <p role="alert" style={styles.errorText}>
          ⚠ 질문을 3자 이상 입력해주세요.
        </p>
      )}

      {/* 학년 / 교과 선택 */}
      <div style={styles.selectRow}>
        <div style={styles.selectGroup}>
          <label style={styles.selectLabel}>학년</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value as Grade)}
            style={styles.select}
            disabled={loading}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div style={styles.selectGroup}>
          <label style={styles.selectLabel}>교과목</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            style={styles.select}
            disabled={loading}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading || !isValid}
          style={{
            ...styles.submitBtn,
            opacity: loading || !isValid ? 0.6 : 1,
            cursor: loading || !isValid ? 'not-allowed' : 'pointer',
            background: loading
              ? '#94a3b8'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          }}
          aria-busy={loading}
        >
          {loading ? (
            <span style={styles.btnInner}>
              <Spinner /> AI 분석 중...
            </span>
          ) : (
            <span style={styles.btnInner}>🔍 질문 분석</span>
          )}
        </button>
      </div>

      {/* 예시 질문 칩 */}
      {showExamples && (
        <div style={styles.examplesSection}>
          <span style={styles.examplesLabel}>💡 예시 질문:</span>
          <div style={styles.chipRow}>
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => handleExampleClick(ex)}
                style={styles.chip}
                disabled={loading}
                title="클릭하여 입력"
              >
                {ex.length > 30 ? ex.slice(0, 30) + '…' : ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── 인라인 스피너 ──────────────────────────────────
const Spinner: React.FC = () => (
  <span style={{
    display: 'inline-block',
    width: '14px', height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    marginRight: '6px',
  }} />
);

// ── 스타일 ─────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(99,102,241,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1e293b',
    letterSpacing: '-0.01em',
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#1e293b',
    background: '#fafafa',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
  },
  charCount: {
    position: 'absolute',
    bottom: '10px',
    right: '14px',
    fontSize: '12px',
    fontWeight: 500,
  },
  shortcutHint: {
    position: 'absolute',
    bottom: '10px',
    left: '14px',
    fontSize: '11px',
    color: '#94a3b8',
  },
  kbd: {
    padding: '1px 4px',
    background: '#f1f5f9',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    fontSize: '10px',
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: '13px',
    color: '#ef4444',
    margin: '4px 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  selectRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  selectGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: '120px',
  },
  selectLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    color: '#1e293b',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  submitBtn: {
    padding: '11px 24px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    transition: 'opacity 0.2s, transform 0.1s',
    whiteSpace: 'nowrap',
    minWidth: '130px',
    alignSelf: 'flex-end',
  },
  btnInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  examplesSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    flexWrap: 'wrap',
  },
  examplesLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748b',
    whiteSpace: 'nowrap',
    marginTop: '4px',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  chip: {
    padding: '5px 12px',
    fontSize: '12px',
    color: '#6366f1',
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
};

export default QuestionInput;
