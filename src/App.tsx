// src/App.tsx
// ─────────────────────────────────────────────────────────────────────────────
// QuestIQ 메인 앱 컴포넌트 (v4 — MongoDB 인증 통합)
// - AuthProvider로 감싸져 JWT 로그인/로그아웃 상태 전역 관리
// - 교사 대시보드 탭은 인증 없이도 데모 모드로 접근 가능
// ─────────────────────────────────────────────────────────────────────────────
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
import { apiLogout, tokenStore } from './services/studentApiService';
import type { Grade, Subject, QuestionHistory } from './types';

type TabId = 'classify' | 'qft' | 'diagnostic' | 'teacher';

// ── 내부 앱 (AuthProvider 하위) ──────────────────────
const AppInner: React.FC = () => {
  // URL ?share=XXXXXXXX → 학생 진단 링크 모드
  const shareCode = new URLSearchParams(window.location.search).get('share') || '';

  const [activeTab, setActiveTab] = useState<TabId>('classify');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { teacher, isLoggedIn, logout } = useAuth();

  // 공유 링크 모드: 전용 페이지 렌더링
  if (shareCode) {
    return (
      <div>
        <style>{globalCSS}</style>
        <StudentDiagnosticLink
          shareCode={shareCode}
          onBack={() => window.location.href = window.location.pathname}
        />
      </div>
    );
  }

  const {
    result, loading, error, tokensUsed, elapsedMs,
    classify, reset, history, clearHistory,
  } = useClassify();

  const handleHistorySelect = useCallback((_item: QuestionHistory) => {
    setActiveTab('classify');
  }, []);

  const isLoading = loading === 'loading';

  const tabs = [
    { id: 'classify'   as TabId, icon: '🔍', label: '질문 분류' },
    { id: 'qft'        as TabId, icon: '🎯', label: 'QFT 세션' },
    { id: 'diagnostic' as TabId, icon: '📊', label: '역량 진단' },
    { id: 'teacher'    as TabId, icon: '👩‍🏫', label: '교사 대시보드' },
  ];

  // 로그인 페이지 표시 (teacher 탭이 아닐 때)
  if (showLogin && !isLoggedIn) {
    return (
      <div>
        <style>{globalCSS}</style>
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 100 }}>
          <button onClick={() => setShowLogin(false)} style={appStyles.backBtn}>
            ← 앱으로 돌아가기
          </button>
        </div>
        <LoginPage />
      </div>
    );
  }

  return (
    <div style={appStyles.root}>
      <style>{globalCSS}</style>

      {/* ── 앱 헤더 ──────────────────────────────── */}
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
            {/* 인증 상태 표시 */}
            {isLoggedIn && teacher ? (
              <div style={appStyles.authBadge}>
                <span style={{ fontSize: 14 }}>👩‍🏫</span>
                <span style={appStyles.authName}>{teacher.name}</span>
                <button onClick={logout} style={appStyles.logoutBtn}>로그아웃</button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} style={appStyles.loginBtn}>
                🔑 교사 로그인
              </button>
            )}

            {/* 히스토리 버튼 */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              style={appStyles.historyBtn}
              title="질문 히스토리"
            >
              📚 히스토리
              {history.length > 0 && (
                <span style={appStyles.badge}>{history.length}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── DB 연동 상태 배너 (로그인 시) ────────── */}
      {isLoggedIn && (
        <div style={appStyles.syncBanner}>
          ✅ MongoDB 연동 중 — 학생 데이터가 실시간으로 DB에 저장됩니다
          {teacher?.school ? ` · ${teacher.school}` : ''}
        </div>
      )}

      {/* ── 메인 컨텐츠 ──────────────────────────── */}
      <main style={appStyles.main}>
        <div style={appStyles.container}>
          <ApiStatusBanner />

          {/* 탭 네비게이션 */}
          <div style={appStyles.tabBar}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); reset(); }}
                style={{
                  ...appStyles.tabBtn,
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#64748b',
                  boxShadow: activeTab === tab.id
                    ? '0 4px 12px rgba(99,102,241,0.3)'
                    : 'none',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ══ 탭 1: 단일 질문 분류 ══ */}
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
              {!result && !isLoading && !error && <IntroGuide />}
            </div>
          )}

          {/* ══ 탭 2: QFT 세션 ══ */}
          {activeTab === 'qft' && (
            <div style={appStyles.tabContent}>
              <QftSessionPanel qFocusTopic="우리 사회의 불평등" defaultGrade="기타" defaultSubject="사회" />
            </div>
          )}

          {/* ══ 탭 3: 역량 진단 ══ */}
          {activeTab === 'diagnostic' && (
            <div style={appStyles.tabContent}>
              <DiagnosticPage />
            </div>
          )}

          {/* ══ 탭 4: 교사 대시보드 ══ */}
          {activeTab === 'teacher' && (
            <div style={appStyles.tabContent}>
              {/* 미인증 안내 배너 (데모 모드) */}
              {!isLoggedIn && (
                <div style={appStyles.demoBanner}>
                  <span>🧪 <strong>데모 모드</strong> — 로그인하면 실제 DB에 학생 데이터가 저장됩니다.</span>
                  <button onClick={() => setShowLogin(true)} style={appStyles.demoBannerBtn}>
                    교사 로그인 →
                  </button>
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

// ── 루트 App (AuthProvider 감쌈) ─────────────────────
const App: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

// ── 초기 안내 컴포넌트 ────────────────────────────────
const IntroGuide: React.FC = () => (
  <div style={appStyles.introCard}>
    <div style={appStyles.introTitle}>📖 QuestIQ 사용 방법</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '12px' }}>
      {[
        { icon: '✍️', step: '1단계', desc: '분석할 질문을 입력하세요' },
        { icon: '📚', step: '2단계', desc: '학년과 교과목을 선택하세요' },
        { icon: '🤖', step: '3단계', desc: 'AI가 Bloom, 마르자노 기준으로 분석해요' },
        { icon: '📈', step: '4단계', desc: '피드백을 보고 질문을 발전시키세요' },
      ].map(({ icon, step, desc }) => (
        <div key={step} style={{
          padding: '16px', background: '#fff', borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#6366f1', marginBottom: '4px' }}>{step}</div>
          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
        </div>
      ))}
    </div>
    <div style={appStyles.theoryBox}>
      <div style={appStyles.theoryTitle}>📐 분류 기준 이론</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {[
          { label: "Bloom's Taxonomy", color: '#6366f1', desc: '6단계 인지 수준' },
          { label: "Marzano",           color: '#10b981', desc: '질문 연속체 4단계' },
          { label: "QFT",               color: '#f59e0b', desc: 'Right Question Institute' },
          { label: "열린/닫힌 분류",    color: '#f97316', desc: '질문 유형 구분' },
        ].map(({ label, color, desc }) => (
          <div key={label} style={{
            padding: '8px 12px', background: `${color}10`,
            border: `1.5px solid ${color}33`, borderRadius: '10px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color }}>{label}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── 전역 CSS ──────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
    min-height: 100vh; color: #1e293b;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  select:focus, input:focus, textarea:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
  }
  button:active { transform: scale(0.97); }
`;

// ── 스타일 ────────────────────────────────────────────
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
  authBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#f0fdf4', border: '1.5px solid #86efac',
    borderRadius: 10, padding: '6px 12px',
  },
  authName: { fontSize: 13, fontWeight: 700, color: '#15803d' },
  logoutBtn: {
    background: 'none', border: 'none', color: '#6b7280',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  loginBtn: {
    padding: '8px 14px', background: 'linear-gradient(135deg,#667eea,#764ba2)',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  historyBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', background: '#f8fafc',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    color: '#64748b', cursor: 'pointer', fontSize: '13px',
    fontWeight: 600, position: 'relative',
    fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s',
  },
  badge: {
    position: 'absolute', top: '-6px', right: '-6px',
    width: '18px', height: '18px', borderRadius: '50%',
    background: '#6366f1', color: '#fff',
    fontSize: '10px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  syncBanner: {
    background: 'linear-gradient(135deg,#059669,#10b981)',
    color: '#fff', fontSize: 13, fontWeight: 600,
    textAlign: 'center', padding: '8px',
  },
  demoBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#fffbeb', border: '1.5px solid #fde68a',
    borderRadius: 12, padding: '12px 16px', fontSize: 13,
  },
  demoBannerBtn: {
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    color: '#fff', border: 'none', borderRadius: 8,
    padding: '6px 14px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
  },
  backBtn: {
    background: 'rgba(255,255,255,0.8)', border: '1px solid #e5e7eb',
    borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
  },
  main: { padding: '24px 20px 60px' },
  container: { maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  tabBar: {
    display: 'flex', gap: '6px', padding: '4px',
    background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  tabBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '6px', padding: '11px', borderRadius: '10px', border: 'none',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s', fontFamily: "'Noto Sans KR', sans-serif",
  },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' },
  loadingCard: {
    display: 'flex', gap: '16px', alignItems: 'center',
    padding: '24px', background: '#fff', borderRadius: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '2px solid #ede9fe',
  },
  loadingSpinner: {
    width: '40px', height: '40px', flexShrink: 0,
    border: '3px solid #ede9fe', borderTopColor: '#6366f1',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  loadingTitle: { fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' },
  loadingDesc: { fontSize: '12px', color: '#94a3b8' },
  errorCard: {
    display: 'flex', gap: '12px', alignItems: 'flex-start',
    padding: '16px 20px', background: '#fef2f2', borderRadius: '14px',
    border: '1.5px solid #fca5a5',
  },
  errorIcon: { fontSize: '24px', flexShrink: 0 },
  errorTitle: { fontSize: '14px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' },
  errorDesc: { fontSize: '13px', color: '#ef4444' },
  errorBtn: {
    marginLeft: 'auto', padding: '6px 12px',
    background: 'transparent', border: '1px solid #fca5a5',
    borderRadius: '8px', color: '#ef4444', cursor: 'pointer',
    fontSize: '12px', fontFamily: "'Noto Sans KR', sans-serif",
    flexShrink: 0, alignSelf: 'center',
  },
  introCard: {
    background: '#fff', borderRadius: '16px', padding: '24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', gap: '20px',
  },
  introTitle: { fontSize: '16px', fontWeight: 800, color: '#1e293b' },
  theoryBox: { background: '#f8fafc', borderRadius: '12px', padding: '16px' },
  theoryTitle: {
    fontSize: '13px', fontWeight: 700, color: '#64748b',
    marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em',
  },
};

export default App;
