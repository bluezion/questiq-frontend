// src/components/seedmode/SeedModePanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 질문 씨앗 모드 — 빈 질문에서 AI가 단계적으로 이끌어주는 모드
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import { classifyQuestion } from '../../services/questiqApi';
import type { Grade, Subject, ClassifyResult } from '../../types';
import { GRADES, SUBJECTS } from '../../services/questiqApi';

// ── 타입 ─────────────────────────────────────────────────────────────────────
type SeedStep = 0 | 1 | 2 | 3 | 4 | 5;

interface GuidingPrompt {
  icon: string;
  frame: string;
  example: string;
  color: string;
}

// ── 과목별 내장 유도 프롬프트 ─────────────────────────────────────────────────
const SUBJECT_PROMPTS: Record<string, GuidingPrompt[]> = {
  default: [
    { icon: '🔍', frame: '{topic}이/가 왜 그렇게 될까요?', example: '"왜"를 파고들면 깊은 질문이 탄생해요', color: '#6366f1' },
    { icon: '🔄', frame: '{topic}이/가 없다면 어떻게 될까요?', example: '없다고 상상하면 본질이 보여요', color: '#8b5cf6' },
    { icon: '⚡', frame: '{topic}과/와 비슷한 것은 무엇인가요?', example: '비교하면 차이점이 더 잘 보여요', color: '#a855f7' },
  ],
  과학: [
    { icon: '🔬', frame: '{topic}은/는 어떤 조건에서 변할까요?', example: '조건을 바꿔보면 패턴이 보여요', color: '#10b981' },
    { icon: '🌱', frame: '{topic}이/가 없다면 생태계에 어떤 영향이 있을까요?', example: '연결고리를 생각해보세요', color: '#059669' },
    { icon: '⚗️', frame: '{topic}의 원인과 결과를 증명하려면 어떤 실험이 필요할까요?', example: '증거를 찾는 질문이 과학의 핵심이에요', color: '#34d399' },
  ],
  수학: [
    { icon: '📐', frame: '{topic}을/를 다른 방법으로 표현하면 어떻게 될까요?', example: '다양한 표현은 수학의 힘이에요', color: '#3b82f6' },
    { icon: '🔢', frame: '{topic}의 패턴을 찾을 수 있나요?', example: '규칙성을 발견하면 수학이 보여요', color: '#2563eb' },
    { icon: '💡', frame: '{topic}이/가 실생활에서 어떻게 쓰이나요?', example: '활용 사례를 찾아보세요', color: '#60a5fa' },
  ],
  국어: [
    { icon: '📝', frame: '이 글에서 {topic}을/를 작가가 표현한 이유는 무엇일까요?', example: '작가의 의도를 생각해봐요', color: '#f59e0b' },
    { icon: '🗣️', frame: '{topic}에 대한 나의 생각과 글쓴이의 생각은 어떻게 다른가요?', example: '비교로 비판적 사고를 키워요', color: '#d97706' },
    { icon: '✍️', frame: '{topic}을/를 다른 장르로 표현하면 어떻게 달라질까요?', example: '다양한 표현 방식을 탐구해보세요', color: '#fbbf24' },
  ],
  사회: [
    { icon: '🌍', frame: '{topic}이/가 사회에 미치는 영향은 무엇일까요?', example: '사회적 맥락을 생각해봐요', color: '#f97316' },
    { icon: '⚖️', frame: '{topic}에 대해 서로 다른 입장을 가진 사람들은 누구일까요?', example: '다양한 관점을 탐구해봐요', color: '#ea580c' },
    { icon: '🔗', frame: '{topic}이/가 생겨난 역사적 배경은 무엇일까요?', example: '역사적 원인을 추적해봐요', color: '#fb923c' },
  ],
  역사: [
    { icon: '⏳', frame: '{topic}이/가 당시 사람들에게 어떤 의미였을까요?', example: '역사 속 인물이 되어 생각해봐요', color: '#8b5cf6' },
    { icon: '🔄', frame: '{topic}이/가 없었다면 역사는 어떻게 달라졌을까요?', example: '반사실적 사고가 역사 이해를 깊게 해요', color: '#7c3aed' },
    { icon: '📜', frame: '{topic}에서 우리가 오늘날 배울 수 있는 교훈은 무엇일까요?', example: '과거에서 현재로 연결해봐요', color: '#a78bfa' },
  ],
  영어: [
    { icon: '🌐', frame: '{topic}을/를 영어권 문화에서는 어떻게 다르게 표현할까요?', example: '문화적 차이를 탐구해봐요', color: '#06b6d4' },
    { icon: '🔤', frame: '{topic}과/와 관련된 영어 표현에는 어떤 것들이 있나요?', example: '언어의 다양성을 발견해봐요', color: '#0891b2' },
    { icon: '💬', frame: '{topic}에 대해 영어로 질문하려면 어떻게 표현할까요?', example: '다른 언어로 생각하면 새로운 관점이 열려요', color: '#22d3ee' },
  ],
};

// 과목별 주제 예시
const SUBJECT_TOPIC_EXAMPLES: Record<string, string[]> = {
  default: ['오늘 배운 개념', '인상 깊었던 내용', '잘 이해 못한 부분'],
  과학: ['광합성', '중력', '세포분열', '화학반응', '진화'],
  수학: ['피타고라스 정리', '함수', '확률', '도형의 넓이', '방정식'],
  국어: ['소설 속 주인공', '비유적 표현', '글쓴이의 주장', '시의 분위기'],
  사회: ['민주주의', '경제 불평등', '환경 문제', '인권', '도시화'],
  역사: ['임진왜란', '산업혁명', '독립운동', '냉전', '세계대전'],
  영어: ['관계대명사', '가정법', '영어 속담', '문화 차이'],
};

// ── 점수 관련 헬퍼 ────────────────────────────────────────────────────────────
const getScoreColor = (score: number): string => {
  if (score >= 8) return '#10b981';
  if (score >= 6) return '#3b82f6';
  if (score >= 4) return '#f59e0b';
  return '#ef4444';
};

const getScoreEmoji = (score: number): string => {
  if (score >= 9) return '🌟';
  if (score >= 7) return '🌸';
  if (score >= 5) return '🌿';
  if (score >= 3) return '🌱';
  return '🌰';
};

const getScoreLabel = (score: number): string => {
  if (score >= 9) return '열매형 — 완성도 높은 질문!';
  if (score >= 7) return '꽃봉오리형 — 좋은 질문이에요!';
  if (score >= 5) return '새싹형 — 성장하는 질문이에요!';
  if (score >= 3) return '씨앗형 — 더 발전할 수 있어요!';
  return '씨앗 전 — 조금 더 구체적으로 써봐요!';
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const SeedModePanel: React.FC = () => {
  const [step, setStep] = useState<SeedStep>(0);
  const [grade, setGrade] = useState<Grade>('기타');
  const [subject, setSubject] = useState<Subject>('기타');
  const [topic, setTopic] = useState('');
  const [selectedFrame, setSelectedFrame] = useState<GuidingPrompt | null>(null);
  const [draftQuestion, setDraftQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<ClassifyResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [improvedDraft, setImprovedDraft] = useState('');

  // 과목별 프롬프트 가져오기
  const getPrompts = useCallback((): GuidingPrompt[] => {
    return SUBJECT_PROMPTS[subject] || SUBJECT_PROMPTS['default'];
  }, [subject]);

  // 프롬프트 텍스트를 주제로 채우기
  const fillPrompt = (frame: string, t: string): string => {
    return frame.replace(/{topic}/g, t || '이 주제');
  };

  // 분석 요청
  const handleAnalyze = useCallback(async (questionToAnalyze: string) => {
    if (!questionToAnalyze.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await classifyQuestion({
        question: questionToAnalyze,
        grade,
        subject,
        context: `주제: ${topic}`,
      });
      setAnalyzeResult(result.data);
      setStep(5);
    } catch (e: any) {
      setAnalyzeError(e?.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [grade, subject, topic]);

  // 리셋
  const handleReset = () => {
    setStep(0);
    setGrade('기타');
    setSubject('기타');
    setTopic('');
    setSelectedFrame(null);
    setDraftQuestion('');
    setAnalyzeResult(null);
    setAnalyzeError(null);
    setImprovedDraft('');
  };

  const topicExamples = SUBJECT_TOPIC_EXAMPLES[subject] || SUBJECT_TOPIC_EXAMPLES['default'];

  return (
    <div style={s.root}>
      {/* 헤더 */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div style={s.headerTitle}>
            <span style={{ fontSize: 28 }}>🌱</span>
            <div>
              <div style={s.title}>질문 씨앗 모드</div>
              <div style={s.subtitle}>빈 질문에서 AI가 단계적으로 이끌어드려요</div>
            </div>
          </div>
          {step > 0 && (
            <button onClick={handleReset} style={s.resetBtn}>↺ 처음으로</button>
          )}
        </div>
        {/* 진행 바 */}
        <div style={s.progressBar}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                ...s.progressDot,
                background: step >= i ? (step === i ? '#6366f1' : '#a5b4fc') : '#e2e8f0',
                transform: step === i ? 'scale(1.3)' : 'scale(1)',
                boxShadow: step === i ? '0 0 0 4px rgba(99,102,241,0.2)' : 'none',
              }}
            />
          ))}
          <div style={{ ...s.progressLine, width: `${(step / 5) * 100}%` }} />
        </div>
        <div style={s.stepLabels}>
          {['준비', '주제', '프레임', '질문 작성', '다듬기', '결과'].map((label, i) => (
            <span key={i} style={{ ...s.stepLabel, color: step === i ? '#6366f1' : '#94a3b8', fontWeight: step === i ? 700 : 400 }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── STEP 0: 학년/과목 선택 ── */}
      {step === 0 && (
        <div style={s.card}>
          <div style={s.cardTitle}>📚 학년과 과목을 선택해주세요</div>
          <div style={s.row}>
            <div style={s.fieldGroup}>
              <label style={s.label}>학년</label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value as Grade)}
                style={s.select}
              >
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>과목</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value as Subject)}
                style={s.select}
              >
                {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>
          <div style={s.tipBox}>
            <span style={{ fontSize: 16 }}>💡</span>
            <span>과목을 선택하면 그 과목에 맞는 질문 프레임을 추천해드려요!</span>
          </div>
          <button
            onClick={() => setStep(1)}
            style={s.primaryBtn}
          >
            시작하기 🌱
          </button>
        </div>
      )}

      {/* ── STEP 1: 오늘의 주제 입력 ── */}
      {step === 1 && (
        <div style={s.card}>
          <div style={s.stepBadge}>STEP 1</div>
          <div style={s.cardTitle}>✏️ 오늘 배운 주제가 무엇인가요?</div>
          <div style={s.cardDesc}>궁금하거나 더 알고 싶은 내용을 적어보세요. 짧아도 괜찮아요!</div>

          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && topic.trim() && setStep(2)}
            placeholder="예: 광합성, 피타고라스 정리, 임진왜란..."
            style={s.input}
            autoFocus
          />

          <div style={s.exampleChips}>
            <span style={s.chipsLabel}>예시 주제:</span>
            {topicExamples.map((ex) => (
              <button
                key={ex}
                onClick={() => setTopic(ex)}
                style={{ ...s.chip, background: topic === ex ? '#ede9fe' : '#f8fafc', border: `1.5px solid ${topic === ex ? '#a78bfa' : '#e2e8f0'}`, color: topic === ex ? '#6366f1' : '#64748b' }}
              >
                {ex}
              </button>
            ))}
          </div>

          <div style={s.btnRow}>
            <button onClick={() => setStep(0)} style={s.secondaryBtn}>← 이전</button>
            <button
              onClick={() => topic.trim() && setStep(2)}
              disabled={!topic.trim()}
              style={{ ...s.primaryBtn, opacity: topic.trim() ? 1 : 0.5 }}
            >
              다음 단계 →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: 질문 프레임 선택 ── */}
      {step === 2 && (
        <div style={s.card}>
          <div style={s.stepBadge}>STEP 2</div>
          <div style={s.cardTitle}>🎯 어떤 방식으로 질문을 만들어볼까요?</div>
          <div style={s.cardDesc}>
            주제: <strong style={{ color: '#6366f1' }}>"{topic}"</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {getPrompts().map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedFrame(prompt);
                  const filled = fillPrompt(prompt.frame, topic);
                  setDraftQuestion(filled);
                }}
                style={{
                  ...s.frameCard,
                  border: `2px solid ${selectedFrame === prompt ? prompt.color : '#e2e8f0'}`,
                  background: selectedFrame === prompt ? `${prompt.color}0d` : '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{prompt.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: selectedFrame === prompt ? prompt.color : '#1e293b', marginBottom: 4 }}>
                      {fillPrompt(prompt.frame, topic)}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{prompt.example}</div>
                  </div>
                  {selectedFrame === prompt && (
                    <span style={{ marginLeft: 'auto', color: prompt.color, fontSize: 20 }}>✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div style={{ ...s.tipBox, marginTop: 16 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <span>프레임을 선택하면 초안 질문이 자동으로 만들어져요. 다음 단계에서 직접 수정할 수 있어요!</span>
          </div>

          <div style={s.btnRow}>
            <button onClick={() => setStep(1)} style={s.secondaryBtn}>← 이전</button>
            <button
              onClick={() => selectedFrame && setStep(3)}
              disabled={!selectedFrame}
              style={{ ...s.primaryBtn, opacity: selectedFrame ? 1 : 0.5 }}
            >
              질문 작성하기 →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: 질문 직접 작성 ── */}
      {step === 3 && (
        <div style={s.card}>
          <div style={s.stepBadge}>STEP 3</div>
          <div style={s.cardTitle}>✍️ 나만의 질문을 완성해보세요</div>
          <div style={s.cardDesc}>프레임을 바탕으로 더 구체적으로 바꿔봐요!</div>

          {selectedFrame && (
            <div style={{ ...s.tipBox, background: `${selectedFrame.color}0d`, border: `1px solid ${selectedFrame.color}22` }}>
              <span>{selectedFrame.icon}</span>
              <span style={{ color: selectedFrame.color, fontWeight: 600 }}>선택한 프레임: {fillPrompt(selectedFrame.frame, topic)}</span>
            </div>
          )}

          <textarea
            value={draftQuestion}
            onChange={e => setDraftQuestion(e.target.value)}
            placeholder="여기에 질문을 입력하거나 수정해보세요..."
            style={s.textarea}
            rows={4}
            autoFocus
          />

          <div style={s.charCount}>
            {draftQuestion.length}자
            {draftQuestion.length < 10 && <span style={{ color: '#f59e0b', marginLeft: 8 }}>💡 조금 더 구체적으로 써봐요!</span>}
            {draftQuestion.length >= 10 && draftQuestion.length < 30 && <span style={{ color: '#3b82f6', marginLeft: 8 }}>👍 좋아요! 더 추가해도 돼요</span>}
            {draftQuestion.length >= 30 && <span style={{ color: '#10b981', marginLeft: 8 }}>🌟 훌륭한 질문이에요!</span>}
          </div>

          <div style={s.btnRow}>
            <button onClick={() => setStep(2)} style={s.secondaryBtn}>← 이전</button>
            <button
              onClick={() => draftQuestion.trim().length >= 5 && setStep(4)}
              disabled={draftQuestion.trim().length < 5}
              style={{ ...s.primaryBtn, opacity: draftQuestion.trim().length >= 5 ? 1 : 0.5 }}
            >
              다듬기 단계 →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: 질문 다듬기 ── */}
      {step === 4 && (
        <div style={s.card}>
          <div style={s.stepBadge}>STEP 4</div>
          <div style={s.cardTitle}>🔧 질문을 더 강하게 만들어볼까요?</div>

          {/* 내 질문 미리보기 */}
          <div style={s.questionPreview}>
            <div style={s.questionPreviewLabel}>📝 현재 내 질문</div>
            <div style={s.questionPreviewText}>"{draftQuestion}"</div>
          </div>

          {/* 개선 체크리스트 */}
          <div style={s.checklistBox}>
            <div style={s.checklistTitle}>✅ 좋은 질문 체크리스트</div>
            {[
              { check: draftQuestion.includes('왜') || draftQuestion.includes('어떻게') || draftQuestion.includes('무엇'), label: '"왜", "어떻게", "무엇" 중 하나가 포함됨', icon: '🔍' },
              { check: draftQuestion.length >= 15, label: '질문이 15자 이상으로 구체적임', icon: '📏' },
              { check: !draftQuestion.endsWith('인가요?') && !draftQuestion.endsWith('에요?') || draftQuestion.length > 20, label: '단순 예/아니오 질문이 아님', icon: '🔓' },
              { check: topic !== '' && draftQuestion.includes(topic.substring(0, Math.min(topic.length, 3))), label: '오늘의 주제가 반영됨', icon: '🎯' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 18 }}>{item.check ? '✅' : '⬜'}</span>
                <span style={{ fontSize: 13, color: item.check ? '#1e293b' : '#94a3b8' }}>{item.icon} {item.label}</span>
              </div>
            ))}
          </div>

          {/* 개선된 질문 직접 수정 */}
          <div style={{ marginTop: 16 }}>
            <div style={s.label}>✏️ 체크리스트를 참고해 질문을 개선해보세요</div>
            <textarea
              value={improvedDraft || draftQuestion}
              onChange={e => setImprovedDraft(e.target.value)}
              style={s.textarea}
              rows={3}
              placeholder="질문을 더 발전시켜보세요..."
            />
          </div>

          {analyzeError && (
            <div style={s.errorBox}>
              ⚠️ {analyzeError}
              <button onClick={() => setAnalyzeError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, color: '#ef4444' }}>✕</button>
            </div>
          )}

          <div style={s.btnRow}>
            <button onClick={() => setStep(3)} style={s.secondaryBtn}>← 이전</button>
            <button
              onClick={() => handleAnalyze(improvedDraft || draftQuestion)}
              disabled={isAnalyzing}
              style={{ ...s.primaryBtn, background: isAnalyzing ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {isAnalyzing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={s.spinnerSmall} /> AI 분석 중...
                </span>
              ) : '🤖 AI로 분석하기'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: 결과 ── */}
      {step === 5 && analyzeResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 성장 축하 카드 */}
          <div style={s.celebrationCard}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {getScoreEmoji(analyzeResult.score)}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
              질문 씨앗이 자랐어요!
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
              {getScoreLabel(analyzeResult.score)}
            </div>
            <div style={s.scoreBig}>
              <span style={{ color: getScoreColor(analyzeResult.score), fontSize: 48, fontWeight: 900 }}>
                {analyzeResult.score}
              </span>
              <span style={{ fontSize: 20, color: '#94a3b8', fontWeight: 400 }}>/10</span>
            </div>
          </div>

          {/* 질문 비교 카드 */}
          <div style={s.compareCard}>
            <div style={s.compareTitle}>📊 질문 성장 과정</div>
            <div style={s.compareRow}>
              <div style={s.compareItem}>
                <div style={s.compareLabel}>🌰 처음 주제</div>
                <div style={{ ...s.compareText, color: '#94a3b8' }}>{topic}</div>
              </div>
              <div style={s.compareArrow}>→</div>
              <div style={s.compareItem}>
                <div style={s.compareLabel}>🌸 완성된 질문</div>
                <div style={{ ...s.compareText, color: '#6366f1', fontWeight: 700 }}>
                  {improvedDraft || draftQuestion}
                </div>
              </div>
            </div>
          </div>

          {/* 분석 결과 요약 */}
          <div style={s.resultCard}>
            <div style={s.resultGrid}>
              <div style={s.resultItem}>
                <div style={s.resultItemLabel}>🧠 Bloom 수준</div>
                <div style={{ ...s.resultItemValue, color: '#6366f1' }}>
                  {analyzeResult.bloom_emoji} {analyzeResult.bloom_level}
                </div>
              </div>
              <div style={s.resultItem}>
                <div style={s.resultItemLabel}>🔓 질문 유형</div>
                <div style={{ ...s.resultItemValue, color: '#10b981' }}>
                  {analyzeResult.open_closed_ko}
                </div>
              </div>
              <div style={s.resultItem}>
                <div style={s.resultItemLabel}>🏅 레벨 뱃지</div>
                <div style={{ ...s.resultItemValue, color: '#f59e0b' }}>
                  {analyzeResult.level_badge_emoji} {analyzeResult.level_badge}
                </div>
              </div>
              <div style={s.resultItem}>
                <div style={s.resultItemLabel}>🔗 마르자노</div>
                <div style={{ ...s.resultItemValue, color: '#8b5cf6' }}>
                  {analyzeResult.marzano_type_ko}
                </div>
              </div>
            </div>
          </div>

          {/* AI 피드백 */}
          <div style={s.feedbackCard}>
            <div style={s.feedbackTitle}>💬 AI 피드백</div>
            <p style={s.feedbackText}>{analyzeResult.feedback}</p>
            {analyzeResult.improved_question && (
              <div style={s.improvedBox}>
                <div style={s.improvedLabel}>✨ 더 발전시킨 질문 예시</div>
                <div style={s.improvedText}>"{analyzeResult.improved_question}"</div>
              </div>
            )}
            {analyzeResult.improvement_tip && (
              <div style={s.tipBox}>
                <span>🎯</span>
                <span>{analyzeResult.improvement_tip}</span>
              </div>
            )}
          </div>

          {/* 다시 시작 버튼 */}
          <button onClick={handleReset} style={s.restartBtn}>
            🌱 새 질문 씨앗 심기
          </button>
        </div>
      )}

      {/* 분석 중 오버레이 */}
      {isAnalyzing && (
        <div style={s.loadingOverlay}>
          <div style={s.loadingCard}>
            <div style={s.spinner} />
            <div style={{ fontWeight: 700, fontSize: 16 }}>🤖 AI가 질문을 분석하고 있어요...</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Bloom 분류학, 마르자노 기준으로 분석 중</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── 스타일 ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    fontFamily: "'Noto Sans KR', sans-serif",
    position: 'relative',
  },
  header: {
    background: 'linear-gradient(135deg, #f0f4ff, #faf5ff)',
    border: '2px solid #e0e7ff',
    borderRadius: 20,
    padding: '20px 24px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 13,
    color: '#6366f1',
    marginTop: 2,
  },
  resetBtn: {
    background: 'none',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    color: '#94a3b8',
    cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  progressBar: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    zIndex: 2,
  },
  progressLine: {
    position: 'absolute',
    left: 6,
    top: '50%',
    height: 3,
    background: 'linear-gradient(90deg, #6366f1, #a5b4fc)',
    borderRadius: 2,
    transition: 'width 0.4s ease',
    zIndex: 1,
    transform: 'translateY(-50%)',
  },
  stepLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stepLabel: {
    fontSize: 11,
    transition: 'all 0.3s',
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: 28,
    boxShadow: '0 2px 12px rgba(99,102,241,0.08)',
    border: '1.5px solid #e0e7ff',
  },
  stepBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
    marginBottom: 12,
    letterSpacing: '0.05em',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#1e293b',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 1.6,
  },
  row: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
  },
  fieldGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 4,
  },
  select: {
    padding: '10px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14,
    color: '#1e293b',
    background: '#f8fafc',
    fontFamily: "'Noto Sans KR', sans-serif",
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e0e7ff',
    borderRadius: 12,
    fontSize: 15,
    fontFamily: "'Noto Sans KR', sans-serif",
    outline: 'none',
    color: '#1e293b',
    marginBottom: 12,
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e0e7ff',
    borderRadius: 12,
    fontSize: 15,
    fontFamily: "'Noto Sans KR', sans-serif",
    outline: 'none',
    color: '#1e293b',
    resize: 'vertical' as const,
    lineHeight: 1.6,
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right' as const,
    marginTop: 4,
    marginBottom: 8,
  },
  tipBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#92400e',
    lineHeight: 1.6,
    marginTop: 4,
  },
  exampleChips: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  chipsLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 600,
  },
  chip: {
    padding: '5px 12px',
    borderRadius: 20,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
    transition: 'all 0.2s',
  },
  frameCard: {
    padding: '16px 18px',
    borderRadius: 14,
    cursor: 'pointer',
    background: '#fff',
    transition: 'all 0.2s',
    fontFamily: "'Noto Sans KR', sans-serif",
    textAlign: 'left' as const,
  },
  checklistBox: {
    background: '#f8fafc',
    borderRadius: 12,
    padding: '16px',
    marginTop: 12,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 8,
  },
  questionPreview: {
    background: 'linear-gradient(135deg, #ede9fe, #faf5ff)',
    border: '2px solid #ddd6fe',
    borderRadius: 14,
    padding: '16px 20px',
    marginBottom: 16,
  },
  questionPreviewLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#8b5cf6',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 6,
  },
  questionPreviewText: {
    fontSize: 15,
    fontWeight: 600,
    color: '#4c1d95',
    lineHeight: 1.5,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1.5px solid #fca5a5',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#dc2626',
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    marginTop: 20,
  },
  primaryBtn: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtn: {
    padding: '14px 20px',
    background: '#f8fafc',
    color: '#64748b',
    border: '1.5px solid #e2e8f0',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  celebrationCard: {
    background: 'linear-gradient(135deg, #faf5ff, #ede9fe)',
    border: '2px solid #c4b5fd',
    borderRadius: 20,
    padding: '32px 24px',
    textAlign: 'center' as const,
  },
  scoreBig: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  compareCard: {
    background: '#fff',
    border: '1.5px solid #e0e7ff',
    borderRadius: 16,
    padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  compareTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 14,
  },
  compareRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  compareItem: {
    flex: 1,
    background: '#f8fafc',
    borderRadius: 10,
    padding: '12px',
  },
  compareLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  compareText: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  compareArrow: {
    fontSize: 20,
    color: '#6366f1',
    fontWeight: 700,
    flexShrink: 0,
  },
  resultCard: {
    background: '#fff',
    border: '1.5px solid #e0e7ff',
    borderRadius: 16,
    padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  resultItem: {
    background: '#f8fafc',
    borderRadius: 10,
    padding: '12px',
  },
  resultItemLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 4,
  },
  resultItemValue: {
    fontSize: 15,
    fontWeight: 700,
  },
  feedbackCard: {
    background: '#fff',
    border: '1.5px solid #e0e7ff',
    borderRadius: 16,
    padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#1e293b',
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 1.8,
  },
  improvedBox: {
    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    border: '1.5px solid #86efac',
    borderRadius: 12,
    padding: '14px 16px',
    marginTop: 14,
  },
  improvedLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#15803d',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 6,
  },
  improvedText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  restartBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  loadingOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(15,23,42,0.4)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '32px 40px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
  },
  spinner: {
    width: 48,
    height: 48,
    border: '4px solid #ede9fe',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  spinnerSmall: {
    width: 18,
    height: 18,
    border: '3px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },
};

export default SeedModePanel;
