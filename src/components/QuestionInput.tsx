// src/components/QuestionInput.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 질문 입력 폼 컴포넌트
// - 질문 텍스트, 학년, 교과 선택
// - 글자 수 카운터, 실시간 유효성 검사
// - 예시 질문 버튼 (페이지 로드 / 10초마다 랜덤 교체)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
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

// ── 풍부한 예시 질문 풀 (교과별·학년별) ──────────────────────────────────────
const ALL_EXAMPLE_QUESTIONS: string[] = [
  // 과학·자연
  '빛이 없으면 지구는 어떻게 될까요?',
  '물은 왜 0도에서 얼고 100도에서 끓을까요?',
  '공룡이 멸종하지 않았다면 지금 세상은 어떨까요?',
  '씨앗이 자라려면 무엇이 반드시 필요할까요?',
  '지구가 둥근 이유는 무엇인가요?',
  '왜 하늘은 낮에는 파랗고 해질 때는 붉어질까요?',
  '중력이 갑자기 사라진다면 무슨 일이 생길까요?',
  '바이러스는 살아있는 것일까요, 아닐까요?',
  '인간이 달에 살 수 있다면 어떤 문제가 생길까요?',
  '블랙홀 안에 들어가면 어떻게 될까요?',

  // 사회·역사
  '산업혁명이 사람들의 생활을 어떻게 바꿨을까요?',
  '민주주의가 없다면 우리 사회는 어떻게 될까요?',
  '기후변화와 경제성장은 공존할 수 있을까요?',
  '역사는 반복된다는 말은 얼마나 타당한가요?',
  '우리나라의 경제가 발전할 수 있었던 핵심 이유는 무엇일까요?',
  '전쟁이 일어나는 근본적인 원인은 무엇일까요?',
  '세금을 더 많이 내면 사회가 더 공평해질까요?',
  '도시와 농촌의 교육 기회 차이는 왜 생길까요?',
  '이민자를 더 많이 받아들이면 사회는 어떻게 변할까요?',
  '조선시대에 인터넷이 있었다면 역사는 어떻게 달라졌을까요?',

  // 기술·AI
  '인터넷이 없어진다면 민주주의는 어떻게 변할까요?',
  '인공지능이 인간의 창의성을 대체할 수 있을까요?',
  '소셜미디어가 우리의 생각을 어떻게 바꾸고 있을까요?',
  '로봇이 일자리를 대체하면 인간은 무엇을 해야 할까요?',
  '스마트폰 없이 하루를 보내면 어떤 느낌일까요?',
  '메타버스는 현실 세계를 대체할 수 있을까요?',
  'AI가 쓴 글과 인간이 쓴 글을 구별할 수 있을까요?',
  '자율주행차가 보편화되면 사회는 어떻게 바뀔까요?',

  // 철학·윤리
  '정의란 무엇이며 우리는 왜 정의로워야 할까요?',
  '거짓말이 항상 나쁜 것일까요?',
  '행복을 돈으로 살 수 있을까요?',
  '우리가 기억하지 못하는 일은 일어난 것일까요?',
  '동물도 권리를 가져야 할까요?',
  '더 많은 자유와 더 많은 안전 중 무엇이 더 중요할까요?',

  // 국어·문학
  '소설 속 주인공이 다른 선택을 했다면 결말은 어떻게 달라졌을까요?',
  '글쓰기에서 가장 중요한 것은 무엇일까요?',
  '독서와 영상 시청 중 어느 것이 더 많이 배울 수 있을까요?',
  '왜 같은 단어가 상황에 따라 다른 의미를 가질까요?',

  // 수학
  '수학이 없다면 세상이 어떻게 달라질까요?',
  '무한이란 정말 존재할 수 있는 개념일까요?',
  '왜 우리는 음수가 필요할까요?',
  '확률이 높다고 반드시 그 일이 일어날까요?',

  // 환경
  '우리가 지금 당장 할 수 있는 환경 보호 방법은 무엇일까요?',
  '왜 산업화는 환경문제를 일으켰나요?',
  '플라스틱 없이 살 수 있는 세상이 가능할까요?',
  '동물 멸종을 막으려면 우리는 무엇을 바꿔야 할까요?',
];

// 페이지 로드 시 랜덤 3개 뽑기
function pickRandom(pool: string[], n: number, exclude: string[] = []): string[] {
  const available = pool.filter(q => !exclude.includes(q));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// 로드 시 placeholder도 랜덤
const PLACEHOLDER_POOL = [
  '예: 왜 산업화는 환경 문제를 일으켰나요?',
  '예: 인공지능이 인간의 창의성을 대체할 수 있을까요?',
  '예: 민주주의가 없다면 우리 사회는 어떻게 될까요?',
  '예: 중력이 갑자기 사라진다면 무슨 일이 생길까요?',
  '예: 역사는 반복된다는 말은 얼마나 타당한가요?',
  '예: 소셜미디어가 우리의 생각을 어떻게 바꾸고 있을까요?',
  '예: 동물도 권리를 가져야 할까요?',
  '예: 수학이 없다면 세상이 어떻게 달라질까요?',
];

const MAX_LENGTH = 500;
const ROTATE_INTERVAL_MS = 12000; // 12초마다 교체

const QuestionInput: React.FC<QuestionInputProps> = ({
  onSubmit,
  loading = false,
  placeholder: _placeholder,
  defaultGrade = '기타',
  defaultSubject = '일반',
  showExamples = true,
  label = '질문 입력',
}) => {
  const [question, setQuestion] = useState('');
  const [grade, setGrade] = useState<Grade>(defaultGrade);
  const [subject, setSubject] = useState<Subject>(defaultSubject);
  const [touched, setTouched] = useState(false);

  // 예시 질문 — 로드 시 랜덤 3개, 이후 12초마다 교체
  const [examples, setExamples] = useState<string[]>(() => pickRandom(ALL_EXAMPLE_QUESTIONS, 3));
  // placeholder도 랜덤
  const [placeholder] = useState<string>(
    _placeholder ?? PLACEHOLDER_POOL[Math.floor(Math.random() * PLACEHOLDER_POOL.length)]
  );
  // fade 애니메이션 트리거
  const [chipFade, setChipFade] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 12초마다 예시 질문 교체
  useEffect(() => {
    const timer = setInterval(() => {
      setChipFade(false);
      setTimeout(() => {
        setExamples(prev => pickRandom(ALL_EXAMPLE_QUESTIONS, 3, prev));
        setChipFade(true);
      }, 300);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const isValid = question.trim().length >= 3;
  const showError = touched && !isValid;

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
        <div style={{
          ...styles.charCount,
          color: charRatio > 0.9 ? '#ef4444' : charRatio > 0.7 ? '#f97316' : '#94a3b8',
        }}>
          {charCount}/{MAX_LENGTH}
        </div>
        {question.length > 0 && (
          <div style={styles.shortcutHint}>
            <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Enter</kbd>로 제출
          </div>
        )}
      </div>

      {showError && (
        <p role="alert" style={styles.errorText}>
          ⚠ 질문을 3자 이상 입력해주세요.
        </p>
      )}

      {/* 학년 / 교과 선택 + 제출 버튼 */}
      <div style={styles.selectRow}>
        <div style={styles.selectGroup}>
          <label style={styles.selectLabel}>학년</label>
          <select value={grade} onChange={(e) => setGrade(e.target.value as Grade)}
            style={styles.select} disabled={loading}>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={styles.selectGroup}>
          <label style={styles.selectLabel}>교과목</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value as Subject)}
            style={styles.select} disabled={loading}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !isValid}
          style={{
            ...styles.submitBtn,
            opacity: loading || !isValid ? 0.6 : 1,
            cursor: loading || !isValid ? 'not-allowed' : 'pointer',
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          }}
          aria-busy={loading}
        >
          {loading ? (
            <span style={styles.btnInner}><Spinner /> AI 분석 중...</span>
          ) : (
            <span style={styles.btnInner}>🔍 질문 분석</span>
          )}
        </button>
      </div>

      {/* 예시 질문 칩 — 12초마다 fade 교체 */}
      {showExamples && (
        <div style={styles.examplesSection}>
          <span style={styles.examplesLabel}>💡 예시 질문:</span>
          <div style={{ ...styles.chipRow, opacity: chipFade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => handleExampleClick(ex)}
                style={styles.chip}
                disabled={loading}
                title="클릭하면 입력창에 자동 입력됩니다"
              >
                {ex.length > 32 ? ex.slice(0, 32) + '…' : ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Spinner: React.FC = () => (
  <span style={{
    display: 'inline-block', width: '14px', height: '14px',
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: '6px',
  }} />
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#fff', borderRadius: '16px', padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(99,102,241,0.06)',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  label: { fontSize: '15px', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.01em' },
  textarea: {
    width: '100%', padding: '14px 16px', fontSize: '15px', lineHeight: '1.7',
    color: '#1e293b', background: '#fafafa', border: '2px solid #e2e8f0',
    borderRadius: '12px', resize: 'vertical', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
    fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
  },
  charCount: { position: 'absolute', bottom: '10px', right: '14px', fontSize: '12px', fontWeight: 500 },
  shortcutHint: { position: 'absolute', bottom: '10px', left: '14px', fontSize: '11px', color: '#94a3b8' },
  kbd: { padding: '1px 4px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '10px', fontFamily: 'monospace' },
  errorText: { fontSize: '13px', color: '#ef4444', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' },
  selectRow: { display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' },
  selectGroup: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '120px' },
  selectLabel: { fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  select: {
    padding: '10px 12px', fontSize: '14px', color: '#1e293b', background: '#f8fafc',
    border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none', cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  submitBtn: {
    padding: '11px 24px', fontSize: '14px', fontWeight: 700, color: '#fff',
    border: 'none', borderRadius: '10px', transition: 'opacity 0.2s, transform 0.1s',
    whiteSpace: 'nowrap', minWidth: '130px', alignSelf: 'flex-end',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  btnInner: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  examplesSection: { display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' },
  examplesLabel: { fontSize: '13px', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', marginTop: '4px' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  chip: {
    padding: '5px 12px', fontSize: '12px', color: '#6366f1', background: '#eef2ff',
    border: '1px solid #c7d2fe', borderRadius: '20px', cursor: 'pointer',
    transition: 'background 0.15s', fontFamily: "'Noto Sans KR', sans-serif",
  },
};

export default QuestionInput;
