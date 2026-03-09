// src/App.tsx
import React, { useState, useCallback } from 'react';
import QuestionInput from './components/QuestionInput';
import ClassifyResultCard from './components/ClassifyResultCard';
import QftSessionPanel from './components/QftSessionPanel';
import QuestionHistoryDrawer from './components/QuestionHistoryDrawer';
import ApiStatusBanner from './components/ApiStatusBanner';
import DiagnosticPage from './components/diagnostic/DiagnosticPage';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import StudentDiagnosticLink from './pages/StudentDiagnosticLink';
import { useClassify } from './hooks/useClassify';
import type { Grade, Subject, QuestionHistory } from './types';

type TabId = 'classify' | 'qft' | 'diagnostic' | 'teacher';

// ── 이론 소개 데이터 ─────────────────────────────────────────────────────────
interface TheoryInfo {
  label: string;
  color: string;
  emoji: string;
  desc: string;
  fullName: string;
  origin: string;
  purpose: string;
  levels: { name: string; desc: string; example: string }[];
  tip: string;
}

const THEORIES: TheoryInfo[] = [
  {
    label: "Bloom's Taxonomy",
    color: '#6366f1',
    emoji: '🧠',
    desc: '6단계 인지 수준',
    fullName: "블룸의 교육목표 분류학 (Bloom's Taxonomy)",
    origin: '1956년 벤저민 블룸(Benjamin Bloom)이 개발, 2001년 앤더슨(Anderson)이 개정',
    purpose: '인지적 사고 수준을 6단계로 구분해, 질문이 어떤 수준의 사고를 요구하는지 측정합니다.',
    levels: [
      { name: '① 기억 (Remember)', desc: '사실·개념을 단순 회상·인식', example: '"수도는 어디인가요?"' },
      { name: '② 이해 (Understand)', desc: '의미를 해석·분류·요약', example: '"광합성이란 무엇인가요?"' },
      { name: '③ 적용 (Apply)', desc: '학습한 개념을 새 상황에 활용', example: '"이 공식으로 문제를 풀어보세요."' },
      { name: '④ 분석 (Analyze)', desc: '구성 요소 분해·관계 파악', example: '"원인과 결과를 비교하면?"' },
      { name: '⑤ 평가 (Evaluate)', desc: '기준에 따라 판단·비판', example: '"이 주장은 타당한가요?"' },
      { name: '⑥ 창조 (Create)', desc: '요소를 결합해 새것을 만들어냄', example: '"어떤 해결책을 설계할 수 있을까요?"' },
    ],
    tip: '💡 좋은 질문은 ④분석 이상의 수준을 포함합니다. "왜?", "어떻게?" 로 시작하는 질문이 고차원 사고를 유도해요.',
  },
  {
    label: 'Marzano',
    color: '#10b981',
    emoji: '🔗',
    desc: '질문 연속체 4단계',
    fullName: '마르자노 질문 연속체 (Marzano\'s Question Continuum)',
    origin: '로버트 마르자노(Robert Marzano)의 수업 설계 이론에서 유래',
    purpose: '질문을 4단계 연속체로 분류해, 학생이 지식을 어떻게 처리·활용하는지 진단합니다.',
    levels: [
      { name: '1단계 — 세부사항 (Detail)', desc: '사실·어휘·용어를 다루는 질문', example: '"이 사건이 일어난 날짜는?"' },
      { name: '2단계 — 범주 (Category)', desc: '개념 간 공통점·차이점 파악', example: '"식물과 동물의 공통점은?"' },
      { name: '3단계 — 정교화 (Elaboration)', desc: '추론·확장·연결을 요구하는 질문', example: '"이 이론이 현실에서 어떻게 적용될까요?"' },
      { name: '4단계 — 증거 (Evidence)', desc: '주장의 근거·증거를 탐색', example: '"그 결론을 뒷받침하는 증거는?"' },
    ],
    tip: '💡 마르자노 3~4단계 질문은 비판적 사고와 탐구 역량을 강화합니다. 단순 사실 확인보다 "왜 그렇게 생각하나요?"를 추가해보세요.',
  },
  {
    label: 'QFT',
    color: '#f59e0b',
    emoji: '🎯',
    desc: 'Right Question Institute',
    fullName: 'QFT — 질문 형성 기법 (Question Formulation Technique)',
    origin: '라이트 퀘스천 인스티튜트(Right Question Institute)의 댄 로스스타인·루즈 산타나 개발',
    purpose: '학생이 스스로 질문을 만들고, 분류하고, 우선순위를 정하는 과정을 통해 질문 역량을 기릅니다.',
    levels: [
      { name: '닫힌 질문 (Closed)', desc: '예/아니오 또는 단답으로 답할 수 있는 질문', example: '"지구는 둥근가요?"' },
      { name: '열린 질문 (Open)', desc: '다양한 관점과 확장된 답변을 유도하는 질문', example: '"지구 온난화를 막으려면 어떤 노력이 필요할까요?"' },
      { name: '우선순위 질문', desc: '핵심 탐구 질문을 선별하고 이유를 토론', example: '"우리 프로젝트에서 가장 중요한 질문은?"' },
      { name: '성찰 질문', desc: '질문 만들기 과정을 되돌아보는 메타인지 질문', example: '"이 질문을 만들면서 무엇을 배웠나요?"' },
    ],
    tip: '💡 QFT의 핵심은 "교사가 질문하고 학생이 답하는" 관계를 뒤집어, 학생이 질문의 주체가 되는 것입니다.',
  },
  {
    label: '열린/닫힌 분류',
    color: '#f97316',
    emoji: '🔓',
    desc: '질문 유형 구분',
    fullName: '열린 질문 / 닫힌 질문 분류 (Open vs. Closed Question)',
    origin: '교육학·언어학·면접 연구에서 광범위하게 사용되는 기본 질문 유형 분류',
    purpose: '질문이 단순 사실 확인인지, 탐구·토론·창의적 사고를 유도하는지 빠르게 구별합니다.',
    levels: [
      { name: '🔒 닫힌 질문', desc: '정해진 정답이 있으며, 짧고 명확한 답변을 기대', example: '"서울의 면적은 몇 km²인가요?"' },
      { name: '🔓 열린 질문', desc: '다양한 답이 가능하며, 설명·추론·토론을 유도', example: '"서울이 과밀화된 이유와 해결책은 무엇일까요?"' },
    ],
    tip: '💡 수업 설계 시 닫힌 질문으로 개념을 확인하고, 열린 질문으로 심화 탐구를 유도하는 조합이 효과적입니다.',
  },
];

// ── 이론 모달 컴포넌트 ────────────────────────────────────────────────────────
const TheoryModal: React.FC<{ theory: TheoryInfo; onClose: () => void }> = ({ theory, onClose }) => (
  <div style={modalStyles.overlay} onClick={onClose}>
    <div style={modalStyles.sheet} onClick={e => e.stopPropagation()}>
      {/* 헤더 */}
      <div style={{ ...modalStyles.header, background: `linear-gradient(135deg, ${theory.color}22, ${theory.color}08)`, borderBottom: `2px solid ${theory.color}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 32 }}>{theory.emoji}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: theory.color }}>{theory.label}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{theory.origin}</div>
          </div>
        </div>
        <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
      </div>

      <div style={modalStyles.body}>
        {/* 목적 */}
        <div style={{ ...modalStyles.section, background: `${theory.color}0d`, borderLeft: `4px solid ${theory.color}` }}>
          <div style={modalStyles.sectionTitle}>📌 이 이론의 목적</div>
          <p style={modalStyles.sectionText}>{theory.purpose}</p>
        </div>

        {/* 단계/수준 */}
        <div>
          <div style={modalStyles.sectionTitle}>📐 단계별 구분</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {theory.levels.map((lv, i) => (
              <div key={i} style={{ ...modalStyles.levelCard, borderLeft: `3px solid ${theory.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{lv.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{lv.desc}</div>
                <div style={{ fontSize: 12, color: theory.color, background: `${theory.color}10`, padding: '3px 8px', borderRadius: 6, display: 'inline-block' }}>
                  예시: {lv.example}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 팁 */}
        <div style={{ ...modalStyles.section, background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>{theory.tip}</p>
        </div>
      </div>
    </div>
  </div>
);

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
    zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    animation: 'fadeIn 0.2s ease',
  },
  sheet: {
    width: '100%', maxWidth: 620, maxHeight: '88vh',
    background: '#fff', borderRadius: '20px 20px 0 0',
    overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
    animation: 'slideUp 0.3s ease',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 18, cursor: 'pointer',
    color: '#94a3b8', padding: '2px 6px', borderRadius: 6,
  },
  body: { padding: '0 24px 32px', display: 'flex', flexDirection: 'column', gap: 16 },
  section: { padding: '12px 16px', borderRadius: '0 10px 10px 0' },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' },
  sectionText: { fontSize: 13, color: '#374151', lineHeight: 1.7 },
  levelCard: { padding: '10px 14px', background: '#f8fafc', borderRadius: '0 10px 10px 0' },
};

// ── 메인 앱 ──────────────────────────────────────────────────────────────────
const AppInner: React.FC = () => {
  const shareCode = new URLSearchParams(window.location.search).get('share') || '';

  // 메뉴 순서: 역량 진단 → 질문 분류 → QFT 세션 → 교사 대시보드
  // (학생 흐름: 진단 먼저 → 질문 분류 연습 → QFT 세션 → 교사가 마지막)
  const [activeTab, setActiveTab] = useState<TabId>('diagnostic');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTheory, setActiveTheory] = useState<TheoryInfo | null>(null);
  const { teacher, isLoggedIn, logout } = useAuth();

  const { result, loading, error, tokensUsed, elapsedMs, classify, reset, history, clearHistory } = useClassify();

  const handleHistorySelect = useCallback((_item: QuestionHistory) => {
    setActiveTab('classify');
  }, []);

  const isLoading = loading === 'loading';

  if (shareCode) {
    return (
      <div>
        <style>{globalCSS}</style>
        <StudentDiagnosticLink shareCode={shareCode} onBack={() => window.location.href = window.location.pathname} />
      </div>
    );
  }

  // 메뉴 순서: 역량 진단 → 질문 분류 → QFT 세션 → 교사 대시보드
  const tabs = [
    { id: 'diagnostic' as TabId, icon: '📊', label: '역량 진단' },
    { id: 'classify'   as TabId, icon: '🔍', label: '질문 분류' },
    { id: 'qft'        as TabId, icon: '🎯', label: 'QFT 세션' },
    { id: 'teacher'    as TabId, icon: '👩‍🏫', label: '교사 대시보드' },
  ];

  if (showLogin && !isLoggedIn) {
    return (
      <div>
        <style>{globalCSS}</style>
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 100 }}>
          <button onClick={() => setShowLogin(false)} style={appStyles.backBtn}>← 앱으로 돌아가기</button>
        </div>
        <LoginPage />
      </div>
    );
  }

  return (
    <div style={appStyles.root}>
      <style>{globalCSS}</style>

      {/* 이론 모달 */}
      {activeTheory && <TheoryModal theory={activeTheory} onClose={() => setActiveTheory(null)} />}

      <header style={appStyles.header}>
        <div style={appStyles.headerContent}>
          <div style={appStyles.logo}>
            <span style={appStyles.logoEmoji}>🎯</span>
            <div>
              <div style={appStyles.logoTitle}>QuestIQ</div>
              <div style={appStyles.logoSub}>AI 질문 역량 진단 시스템</div>
            </div>
          </div>
          <div style={appStyles.headerRight}>
            {isLoggedIn && teacher ? (
              <div style={appStyles.authBadge}>
                <span style={{ fontSize: 14 }}>👩‍🏫</span>
                <span style={appStyles.authName}>{teacher.name}</span>
                <button onClick={logout} style={appStyles.logoutBtn}>로그아웃</button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} style={appStyles.loginBtn}>🔑 교사 로그인</button>
            )}
            <button onClick={() => setIsHistoryOpen(true)} style={appStyles.historyBtn} title="질문 히스토리">
              📚 히스토리
              {history.length > 0 && <span style={appStyles.badge}>{history.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {isLoggedIn && (
        <div style={appStyles.syncBanner}>
          ✅ MongoDB 연동 중 — 학생 데이터가 실시간으로 DB에 저장됩니다
          {teacher?.school ? ` · ${teacher.school}` : ''}
        </div>
      )}

      <main style={appStyles.main}>
        <div style={appStyles.container}>
          <ApiStatusBanner />

          <div style={appStyles.tabBar}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); reset(); }}
                style={{
                  ...appStyles.tabBtn,
                  background: activeTab === tab.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#64748b',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── 역량 진단 탭 ── */}
          {activeTab === 'diagnostic' && (
            <div style={appStyles.tabContent}>
              <DiagnosticPage />
            </div>
          )}

          {/* ── 질문 분류 탭 ── */}
          {activeTab === 'classify' && (
            <div style={appStyles.tabContent}>
              <QuestionInput
                onSubmit={(q: string, g: Grade, s: Subject) => classify({ question: q, grade: g, subject: s })}
                loading={isLoading}
                showExamples={!result}
              />
              {isLoading && (
                <div style={appStyles.loadingCard}>
                  <div style={appStyles.loadingSpinner} />
                  <div>
                    <div style={appStyles.loadingTitle}>🤖 AI가 질문을 분석하고 있어요...</div>
                    <div style={appStyles.loadingDesc}>Bloom 분류학, 마르자노 연속체, QFT 기준으로 분석 중</div>
                  </div>
                </div>
              )}
              {error && !isLoading && (
                <div style={appStyles.errorCard}>
                  <div style={appStyles.errorIcon}>⚠️</div>
                  <div>
                    <div style={appStyles.errorTitle}>분석 오류가 발생했습니다</div>
                    <div style={appStyles.errorDesc}>{error}</div>
                  </div>
                  <button onClick={reset} style={appStyles.errorBtn}>닫기</button>
                </div>
              )}
              {result && !isLoading && (
                <ClassifyResultCard result={result} onReAnalyze={reset} tokensUsed={tokensUsed} elapsedMs={elapsedMs} />
              )}
              {!result && !isLoading && !error && <IntroGuide onTheoryClick={setActiveTheory} />}
            </div>
          )}

          {/* ── QFT 세션 탭 ── */}
          {activeTab === 'qft' && (
            <div style={appStyles.tabContent}>
              <QftSessionPanel qFocusTopic="우리 사회의 불평등" defaultGrade="기타" defaultSubject="사회" />
            </div>
          )}

          {/* ── 교사 대시보드 탭 ── */}
          {activeTab === 'teacher' && (
            <div style={appStyles.tabContent}>
              {!isLoggedIn && (
                <div style={appStyles.demoBanner}>
                  <span>🧪 <strong>데모 모드</strong> — 로그인하면 실제 DB에 학생 데이터가 저장됩니다.</span>
                  <button onClick={() => setShowLogin(true)} style={appStyles.demoBannerBtn}>교사 로그인 →</button>
                </div>
              )}
              <TeacherDashboard />
            </div>
          )}
        </div>
      </main>

      <QuestionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleHistorySelect}
        onClearAll={clearHistory}
      />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider><AppInner /></AuthProvider>
);

// ── IntroGuide (이론 카드 클릭 가능) ─────────────────────────────────────────
const IntroGuide: React.FC<{ onTheoryClick: (t: TheoryInfo) => void }> = ({ onTheoryClick }) => (
  <div style={appStyles.introCard}>
    <div style={appStyles.introTitle}>📖 QuestIQ 사용 방법</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '12px' }}>
      {[
        { icon: '✍️', step: '1단계', desc: '분석할 질문을 입력하세요' },
        { icon: '📚', step: '2단계', desc: '학년과 교과목을 선택하세요' },
        { icon: '🤖', step: '3단계', desc: 'AI가 Bloom, 마르자노 기준으로 분석해요' },
        { icon: '📈', step: '4단계', desc: '피드백을 보고 질문을 발전시키세요' },
      ].map(({ icon, step, desc }) => (
        <div key={step} style={{ padding: '16px', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#6366f1', marginBottom: '4px' }}>{step}</div>
          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
        </div>
      ))}
    </div>

    <div style={appStyles.theoryBox}>
      <div style={appStyles.theoryTitle}>📐 분류 기준 이론 <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>클릭해서 자세히 보기 →</span></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {THEORIES.map((t) => (
          <button
            key={t.label}
            onClick={() => onTheoryClick(t)}
            style={{
              padding: '8px 12px', background: `${t.color}10`,
              border: `1.5px solid ${t.color}33`, borderRadius: '10px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'transform 0.15s, box-shadow 0.15s',
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 12px ${t.color}33`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = ''; }}
            title={`${t.label} 자세히 보기`}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: t.color }}>{t.emoji} {t.label}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── 전역 CSS ──────────────────────────────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
    min-height: 100vh; color: #1e293b;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  select:focus, input:focus, textarea:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
  }
  button:active { transform: scale(0.97); }
`;

// ── 스타일 ────────────────────────────────────────────────────────────────────
const appStyles: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', fontFamily: "'Noto Sans KR', sans-serif" },
  header: {
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(99,102,241,0.1)', position: 'sticky', top: 0, zIndex: 30,
  },
  headerContent: {
    maxWidth: '860px', margin: '0 auto', padding: '14px 20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoEmoji: { fontSize: '28px' },
  logoTitle: { fontSize: '20px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' },
  logoSub: { fontSize: '12px', color: '#94a3b8' },
  headerRight: { display: 'flex', gap: '8px', alignItems: 'center' },
  authBadge: { display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '6px 12px' },
  authName: { fontSize: 13, fontWeight: 700, color: '#15803d' },
  logoutBtn: { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" },
  loginBtn: { padding: '8px 14px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" },
  historyBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: 600, position: 'relative', fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s' },
  badge: { position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#6366f1', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  syncBanner: { background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '8px' },
  demoBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '12px 16px', fontSize: 13 },
  demoBannerBtn: { background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" },
  backBtn: { background: 'rgba(255,255,255,0.8)', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" },
  main: { padding: '24px 20px 60px' },
  container: { maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  tabBar: { display: 'flex', gap: '6px', padding: '4px', background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tabBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Noto Sans KR', sans-serif" },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' },
  loadingCard: { display: 'flex', gap: '16px', alignItems: 'center', padding: '24px', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '2px solid #ede9fe' },
  loadingSpinner: { width: '40px', height: '40px', flexShrink: 0, border: '3px solid #ede9fe', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingTitle: { fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' },
  loadingDesc: { fontSize: '12px', color: '#94a3b8' },
  errorCard: { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px 20px', background: '#fef2f2', borderRadius: '14px', border: '1.5px solid #fca5a5' },
  errorIcon: { fontSize: '24px', flexShrink: 0 },
  errorTitle: { fontSize: '14px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' },
  errorDesc: { fontSize: '13px', color: '#ef4444' },
  errorBtn: { marginLeft: 'auto', padding: '6px 12px', background: 'transparent', border: '1px solid #fca5a5', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontFamily: "'Noto Sans KR', sans-serif", flexShrink: 0, alignSelf: 'center' },
  introCard: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '20px' },
  introTitle: { fontSize: '16px', fontWeight: 800, color: '#1e293b' },
  theoryBox: { background: '#f8fafc', borderRadius: '12px', padding: '16px' },
  theoryTitle: { fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' },
};

export default App;
