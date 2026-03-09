// src/components/timecapsule/TimeCapsulePanel.tsx
import React, { useState, useEffect } from 'react';

interface Capsule {
  id: string;
  question: string;
  score: number;
  bloomLevel: string;
  bloomEmoji: string;
  subject: string;
  createdAt: string;
  openAt: string;
  isOpened: boolean;
  note: string;
}

const STORAGE_KEY = 'jilmoonsaem_capsules';

function loadCapsules(): Capsule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCapsules(capsules: Capsule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function daysLeft(openAt: string): number {
  const now = new Date();
  const open = new Date(openAt);
  return Math.max(0, Math.ceil((open.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

const BLOOM_COLORS: Record<string, string> = {
  기억: '#6b7280', 이해: '#3b82f6', 적용: '#10b981',
  분석: '#6366f1', 평가: '#f59e0b', 창의: '#ef4444',
};

const TimeCapsulePanel: React.FC = () => {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('과학');
  const [bloomLevel, setBloomLevel] = useState('이해');
  const [score, setScore] = useState(70);
  const [note, setNote] = useState('');
  const [openDays, setOpenDays] = useState(30);
  const [activeTab, setActiveTab] = useState<'sealed' | 'opened'>('sealed');

  useEffect(() => {
    setCapsules(loadCapsules());
  }, []);

  const handleSave = () => {
    if (!question.trim()) return;
    const now = new Date();
    const newCapsule: Capsule = {
      id: Date.now().toString(),
      question: question.trim(),
      score,
      bloomLevel,
      bloomEmoji: ['기억', '이해', '적용', '분석', '평가', '창의'].includes(bloomLevel)
        ? ['🫘', '💡', '🛠️', '🔍', '⚖️', '🌟'][['기억', '이해', '적용', '분석', '평가', '창의'].indexOf(bloomLevel)]
        : '💡',
      subject,
      createdAt: now.toISOString(),
      openAt: addDays(now, openDays).toISOString(),
      isOpened: false,
      note: note.trim(),
    };
    const updated = [newCapsule, ...capsules];
    setCapsules(updated);
    saveCapsules(updated);
    setQuestion(''); setNote(''); setScore(70); setShowForm(false);
  };

  const handleOpen = (id: string) => {
    const updated = capsules.map(c => c.id === id ? { ...c, isOpened: true } : c);
    setCapsules(updated);
    saveCapsules(updated);
  };

  const handleDelete = (id: string) => {
    const updated = capsules.filter(c => c.id !== id);
    setCapsules(updated);
    saveCapsules(updated);
  };

  const sealed = capsules.filter(c => !c.isOpened);
  const opened = capsules.filter(c => c.isOpened);

  const card: React.CSSProperties = {
    background: '#fff', borderRadius: '14px', padding: '16px',
    marginBottom: '12px', boxShadow: '0 2px 10px rgba(99,102,241,0.07)',
    border: '1px solid #ede9ff',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>⏳</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3730a3', margin: '0 0 6px' }}>질문 타임캡슐</h2>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>오늘의 질문을 봉인하고 미래의 나에게 전달하세요!</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: '봉인된 캡슐', value: sealed.length, emoji: '🔒', color: '#6366f1' },
          { label: '개봉된 캡슐', value: opened.length, emoji: '📬', color: '#10b981' },
          { label: '전체 캡슐', value: capsules.length, emoji: '📦', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ ...card, textAlign: 'center', padding: '12px', borderTop: `3px solid ${s.color}`, marginBottom: 0 }}>
            <div style={{ fontSize: '1.2rem' }}>{s.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          width: '100%', padding: '12px', background: showForm ? '#f3f4f6' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: showForm ? '#374151' : '#fff', border: 'none', borderRadius: '12px',
          fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', marginBottom: '16px',
        }}
      >
        {showForm ? '✕ 취소' : '+ 새 타임캡슐 만들기'}
      </button>

      {/* Form */}
      {showForm && (
        <div style={{ ...card, background: 'linear-gradient(135deg,#f5f3ff,#ede9ff)', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 700, color: '#4338ca', margin: '0 0 14px', fontSize: '1rem' }}>✍️ 질문 봉인하기</h3>

          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="오늘 가장 궁금했던 질문을 입력하세요..."
            rows={3}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #c4b5fd', fontSize: '0.9rem', resize: 'none', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>과목</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '0.85rem' }}>
                {['과학', '국어', '수학', '사회', '영어', '기타'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>블룸 단계</label>
              <select value={bloomLevel} onChange={e => setBloomLevel(e.target.value)}
                style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '0.85rem' }}>
                {['기억', '이해', '적용', '분석', '평가', '창의'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>질문 점수: <b style={{ color: '#6366f1' }}>{score}점</b></label>
            <input type="range" min={0} max={100} value={score} onChange={e => setScore(Number(e.target.value))}
              style={{ display: 'block', width: '100%', marginTop: '4px', accentColor: '#6366f1' }} />
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>미래의 나에게 남기는 메모 (선택)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="이 질문을 왜 중요하다고 생각했나요?"
              style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '0.85rem', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>개봉 시기</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              {[7, 30, 60, 90].map(d => (
                <button key={d} onClick={() => setOpenDays(d)}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', border: 'none',
                    background: openDays === d ? '#6366f1' : '#e5e7eb', color: openDays === d ? '#fff' : '#374151' }}>
                  {d}일 후
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={!question.trim()}
            style={{ width: '100%', marginTop: '14px', padding: '12px', background: question.trim() ? '#6366f1' : '#d1d5db',
              color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: question.trim() ? 'pointer' : 'not-allowed' }}>
            🔒 타임캡슐 봉인하기
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {(['sealed', 'opened'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ flex: 1, padding: '9px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              border: activeTab === t ? 'none' : '1px solid #e5e7eb',
              background: activeTab === t ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff',
              color: activeTab === t ? '#fff' : '#6b7280' }}>
            {t === 'sealed' ? `🔒 봉인 (${sealed.length})` : `📬 개봉 (${opened.length})`}
          </button>
        ))}
      </div>

      {/* Capsule List */}
      {activeTab === 'sealed' && (
        sealed.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
            <div>아직 봉인된 캡슐이 없어요.<br/>첫 타임캡슐을 만들어 보세요!</div>
          </div>
        ) : (
          sealed.map(c => {
            const left = daysLeft(c.openAt);
            const canOpen = left === 0;
            return (
              <div key={c.id} style={{ ...card, borderLeft: `4px solid ${BLOOM_COLORS[c.bloomLevel] ?? '#6366f1'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', background: '#ede9ff', color: '#6d28d9', borderRadius: '99px' }}>{c.subject}</span>
                      <span style={{ fontSize: '0.72rem', padding: '2px 7px', background: `${BLOOM_COLORS[c.bloomLevel] ?? '#6366f1'}20`, color: BLOOM_COLORS[c.bloomLevel] ?? '#6366f1', borderRadius: '99px', fontWeight: 600 }}>
                        {c.bloomEmoji} {c.bloomLevel}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1' }}>{c.score}점</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937', marginBottom: '6px' }}>"{c.question}"</div>
                    {c.note && <div style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '6px' }}>📝 {c.note}</div>}
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                      📅 봉인일: {formatDate(c.createdAt)} · 개봉일: {formatDate(c.openAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    {canOpen ? (
                      <button onClick={() => handleOpen(c.id)}
                        style={{ padding: '7px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                        📬 개봉!
                      </button>
                    ) : (
                      <div style={{ padding: '7px 10px', background: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#6366f1' }}>{left}</div>
                        <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>일 남음</div>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(c.id)}
                  style={{ marginTop: '8px', padding: '4px 10px', background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                  삭제
                </button>
              </div>
            );
          })
        )
      )}

      {activeTab === 'opened' && (
        opened.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎁</div>
            <div>아직 개봉된 캡슐이 없어요!</div>
          </div>
        ) : (
          opened.map(c => (
            <div key={c.id} style={{ ...card, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', background: '#a7f3d0', color: '#065f46', borderRadius: '99px' }}>{c.subject}</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 7px', background: `${BLOOM_COLORS[c.bloomLevel] ?? '#10b981'}20`, color: BLOOM_COLORS[c.bloomLevel] ?? '#10b981', borderRadius: '99px', fontWeight: 600 }}>
                  {c.bloomEmoji} {c.bloomLevel}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>{c.score}점</span>
                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>📅 {formatDate(c.createdAt)} 봉인 → {formatDate(c.openAt)} 개봉</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#065f46', marginBottom: '6px' }}>"{c.question}"</div>
              {c.note && <div style={{ fontSize: '0.78rem', color: '#047857', fontStyle: 'italic' }}>📝 {c.note}</div>}
              <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', fontSize: '0.78rem', color: '#065f46' }}>
                🎉 이 질문을 봉인했을 때보다 지금 더 잘 대답할 수 있나요?
              </div>
            </div>
          ))
        )
      )}
    </div>
  );
};

export default TimeCapsulePanel;
