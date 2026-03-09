// src/components/ranking/ClassRankingPanel.tsx
import React, { useState, useCallback } from 'react';

interface StudentRank {
  rank: number;
  name: string;
  questionCount: number;
  avgScore: number;
  bloomLevel: string;
  bloomEmoji: string;
  badge: string;
  change: 'up' | 'down' | 'same';
}

interface WeeklyStats {
  classAvg: number;
  totalQuestions: number;
  topQuestion: string;
  participationRate: number;
}

const DEMO_STUDENTS: StudentRank[] = [
  { rank: 1, name: '김민준', questionCount: 18, avgScore: 92, bloomLevel: '창의', bloomEmoji: '🌟', badge: '질문의 달인', change: 'same' },
  { rank: 2, name: '이서연', questionCount: 15, avgScore: 88, bloomLevel: '평가', bloomEmoji: '🔥', badge: '크리티컬 씽커', change: 'up' },
  { rank: 3, name: '박지호', questionCount: 14, avgScore: 85, bloomLevel: '분석', bloomEmoji: '💡', badge: '탐구자', change: 'up' },
  { rank: 4, name: '최수아', questionCount: 12, avgScore: 80, bloomLevel: '적용', bloomEmoji: '🌿', badge: '질문 새싹', change: 'down' },
  { rank: 5, name: '정하윤', questionCount: 10, avgScore: 75, bloomLevel: '이해', bloomEmoji: '🌱', badge: '새싹형', change: 'same' },
  { rank: 6, name: '강도현', questionCount: 9, avgScore: 72, bloomLevel: '이해', bloomEmoji: '🌱', badge: '새싹형', change: 'up' },
  { rank: 7, name: '윤채원', questionCount: 8, avgScore: 68, bloomLevel: '기억', bloomEmoji: '🫘', badge: '씨앗형', change: 'down' },
];

const DEMO_STATS: WeeklyStats = {
  classAvg: 80,
  totalQuestions: 86,
  topQuestion: '왜 식물은 빛이 없으면 광합성을 못 하는 걸까?',
  participationRate: 87,
};

const SUBJECT_DATA = [
  { subject: '과학', count: 24, color: '#6366f1' },
  { subject: '국어', count: 20, color: '#10b981' },
  { subject: '수학', count: 18, color: '#f59e0b' },
  { subject: '사회', count: 15, color: '#ef4444' },
  { subject: '영어', count: 9, color: '#8b5cf6' },
];

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const ClassRankingPanel: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'loading' | 'dashboard'>('setup');
  const [classCode, setClassCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [rankingData, setRankingData] = useState<StudentRank[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'leaderboard' | 'stats'>('leaderboard');

  const loadData = useCallback((code: string) => {
    setStep('loading');
    setErrorMsg('');
    setTimeout(() => {
      setClassCode(code);
      setRankingData(DEMO_STUDENTS);
      setWeeklyStats(DEMO_STATS);
      setStep('dashboard');
    }, 1500);
  }, []);

  const handleCreate = useCallback(() => {
    const code = generateCode();
    setSuccessMsg(`클래스 코드 생성 완료: ${code}`);
    loadData(code);
  }, [loadData]);

  const handleJoin = useCallback(() => {
    const trimmed = inputCode.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setErrorMsg('클래스 코드는 6자리여야 합니다.');
      return;
    }
    setErrorMsg('');
    loadData(trimmed);
  }, [inputCode, loadData]);

  const handleLeave = useCallback(() => {
    setStep('setup');
    setClassCode('');
    setRankingData([]);
    setWeeklyStats(null);
    setSuccessMsg('');
    setInputCode('');
  }, []);

  /* ── STYLES ── */
  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 2px 12px rgba(99,102,241,0.08)',
    border: '1px solid #ede9ff',
  };

  const rankColors: Record<number, string> = { 1: '#f59e0b', 2: '#9ca3af', 3: '#cd7c3a' };
  const rankBg: Record<number, string> = { 1: '#fffbeb', 2: '#f9fafb', 3: '#fdf3ea' };

  /* ── SETUP SCREEN ── */
  if (step === 'setup') {
    return (
      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏆</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3730a3', margin: '0 0 6px' }}>클래스 질문 랭킹</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>우리 반의 질문 활동을 함께 확인해요!</p>
        </div>

        {/* Create */}
        <div style={{ ...card, background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#4338ca', marginTop: 0 }}>✨ 새 클래스 만들기</h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '14px' }}>교사용 — 새 클래스 코드를 생성합니다.</p>
          <button
            onClick={handleCreate}
            style={{
              width: '100%', padding: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700,
              fontSize: '0.95rem', cursor: 'pointer',
            }}
          >
            🎲 클래스 코드 생성하기
          </button>
          {successMsg && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#ecfdf5', borderRadius: '8px', color: '#065f46', fontSize: '0.85rem', fontWeight: 600 }}>
              ✅ {successMsg}
            </div>
          )}
        </div>

        {/* Join */}
        <div style={card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginTop: 0 }}>🔑 클래스 참여하기</h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '14px' }}>학생용 — 선생님께 받은 6자리 코드를 입력하세요.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="예: AB3K7M"
              style={{
                flex: 1, padding: '10px 14px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '1rem', fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase',
              }}
            />
            <button
              onClick={handleJoin}
              style={{
                padding: '10px 18px', background: '#10b981', color: '#fff',
                border: 'none', borderRadius: '10px', fontWeight: 700,
                fontSize: '0.9rem', cursor: 'pointer',
              }}
            >
              참여
            </button>
          </div>
          {errorMsg && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', color: '#b91c1c', fontSize: '0.83rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── LOADING SCREEN ── */
  if (step === 'loading') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
        <p style={{ color: '#6b7280', marginTop: '16px', fontSize: '0.95rem' }}>랭킹 데이터 불러오는 중...</p>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  /* ── DASHBOARD ── */
  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ ...card, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '4px' }}>클래스 코드</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.15em' }}>{classCode}</div>
          <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '4px' }}>🟢 실시간 업데이트 중</div>
        </div>
        <button
          onClick={handleLeave}
          style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          나가기
        </button>
      </div>

      {/* Weekly Stats */}
      {weeklyStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: '클래스 평균 점수', value: `${weeklyStats.classAvg}점`, emoji: '📊', color: '#6366f1' },
            { label: '이번 주 총 질문', value: `${weeklyStats.totalQuestions}개`, emoji: '❓', color: '#10b981' },
            { label: '참여율', value: `${weeklyStats.participationRate}%`, emoji: '👥', color: '#f59e0b' },
            { label: '이번 주 베스트 질문', value: '보기', emoji: '⭐', color: '#ef4444' },
          ].map(item => (
            <div key={item.label} style={{ ...card, padding: '14px', textAlign: 'center', borderTop: `3px solid ${item.color}`, marginBottom: 0 }}>
              <div style={{ fontSize: '1.4rem' }}>{item.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: item.color, margin: '4px 0' }}>{item.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Best Question */}
      {weeklyStats && (
        <div style={{ ...card, background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderLeft: '4px solid #f59e0b', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 700, marginBottom: '6px' }}>⭐ 이번 주 베스트 질문</div>
          <div style={{ fontSize: '0.95rem', color: '#78350f', fontStyle: 'italic' }}>"{weeklyStats.topQuestion}"</div>
        </div>
      )}

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {(['leaderboard', 'stats'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveSubTab(t)}
            style={{
              flex: 1, padding: '9px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              border: activeSubTab === t ? 'none' : '1px solid #e5e7eb',
              background: activeSubTab === t ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff',
              color: activeSubTab === t ? '#fff' : '#6b7280',
            }}
          >
            {t === 'leaderboard' ? '🏆 리더보드' : '📊 과목별 현황'}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {activeSubTab === 'leaderboard' && (
        <div>
          {rankingData.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
              <div>아직 랭킹 데이터가 없습니다.</div>
            </div>
          ) : (
            rankingData.map(student => (
              <div
                key={student.rank}
                style={{
                  ...card,
                  padding: '14px 16px',
                  marginBottom: '10px',
                  background: rankBg[student.rank] ?? '#fff',
                  borderLeft: `4px solid ${rankColors[student.rank] ?? '#e5e7eb'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {/* Rank Badge */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: rankColors[student.rank] ?? '#e5e7eb',
                  color: student.rank <= 3 ? '#fff' : '#374151',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '0.9rem', flexShrink: 0,
                }}>
                  {student.rank <= 3 ? ['🥇', '🥈', '🥉'][student.rank - 1] : student.rank}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>{student.name}</span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 7px', background: '#ede9ff', color: '#6d28d9', borderRadius: '99px', fontWeight: 600 }}>
                      {student.bloomEmoji} {student.bloomLevel}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: student.change === 'up' ? '#10b981' : student.change === 'down' ? '#ef4444' : '#9ca3af' }}>
                      {student.change === 'up' ? '▲' : student.change === 'down' ? '▼' : '—'}
                    </span>
                  </div>
                  {/* Score Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${student.avgScore}%`, height: '100%', background: rankColors[student.rank] ?? '#6366f1', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', minWidth: '36px' }}>{student.avgScore}점</span>
                  </div>
                </div>

                {/* Count */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#6366f1' }}>{student.questionCount}</div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>질문</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Subject Stats */}
      {activeSubTab === 'stats' && (
        <div style={card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginTop: 0, marginBottom: '16px' }}>📚 과목별 질문 현황</h3>
          {SUBJECT_DATA.map(item => (
            <div key={item.subject} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{item.subject}</span>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{item.count}개</span>
              </div>
              <div style={{ height: '10px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(item.count / 24) * 100}%`,
                  height: '100%',
                  background: item.color,
                  borderRadius: '99px',
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassRankingPanel;
