// src/components/template/QuestionTemplatePanel.tsx
import React, { useState } from 'react';

interface Template {
  id: string;
  frame: string;
  example: string;
  bloom: string;
  bloomEmoji: string;
}

const TEMPLATES: Record<string, Template[]> = {
  과학: [
    { id: 's1', frame: '왜 [현상]이 일어나는가?', example: '왜 물은 100℃에서 끓는가?', bloom: '분석', bloomEmoji: '🔍' },
    { id: 's2', frame: '[개념A]와 [개념B]의 차이는 무엇인가?', example: '광합성과 호흡의 차이는?', bloom: '분석', bloomEmoji: '🔍' },
    { id: 's3', frame: '[현상]이 없다면 어떤 일이 생길까?', example: '중력이 없다면?', bloom: '창의', bloomEmoji: '🌟' },
    { id: 's4', frame: '[개념]의 원인은 무엇인가?', example: '지구 온난화의 원인은?', bloom: '이해', bloomEmoji: '💡' },
    { id: 's5', frame: '[실험 결과]가 의미하는 바는?', example: '산성비 실험 결과가 의미하는 바는?', bloom: '평가', bloomEmoji: '⚖️' },
    { id: 's6', frame: '[기술]이 사회에 미치는 영향은?', example: '유전자 편집 기술의 영향은?', bloom: '평가', bloomEmoji: '⚖️' },
  ],
  국어: [
    { id: 'k1', frame: '[인물]이 [행동]한 이유는?', example: '홍길동이 집을 떠난 이유는?', bloom: '분석', bloomEmoji: '🔍' },
    { id: 'k2', frame: '[작품]의 주제를 어떻게 해석할 수 있는가?', example: '소나기의 주제 해석은?', bloom: '평가', bloomEmoji: '⚖️' },
    { id: 'k3', frame: '[표현]이 독자에게 주는 감정은?', example: '반복법이 독자에게 주는 감정은?', bloom: '이해', bloomEmoji: '💡' },
    { id: 'k4', frame: '[상황]에서 나라면 어떻게 했을까?', example: '이 상황에서 나라면 어떻게 했을까?', bloom: '창의', bloomEmoji: '🌟' },
    { id: 'k5', frame: '[주장]을 뒷받침하는 근거는?', example: '이 주장을 뒷받침하는 근거는?', bloom: '분석', bloomEmoji: '🔍' },
  ],
  수학: [
    { id: 'm1', frame: '[개념]을 실생활에서 어떻게 활용할 수 있는가?', example: '피타고라스 정리를 실생활에서?', bloom: '적용', bloomEmoji: '🛠️' },
    { id: 'm2', frame: '이 문제를 다른 방법으로 풀 수 있는가?', example: '이 방정식을 다른 방법으로?', bloom: '창의', bloomEmoji: '🌟' },
    { id: 'm3', frame: '[공식]이 성립하는 이유는?', example: '넓이 공식이 성립하는 이유는?', bloom: '이해', bloomEmoji: '💡' },
    { id: 'm4', frame: '[개념A]와 [개념B]는 어떤 관계가 있는가?', example: '미분과 적분의 관계는?', bloom: '분석', bloomEmoji: '🔍' },
    { id: 'm5', frame: '[조건]이 바뀌면 결과가 어떻게 달라지는가?', example: '변수가 바뀌면?', bloom: '분석', bloomEmoji: '🔍' },
  ],
  사회: [
    { id: 'so1', frame: '[역사 사건]의 원인과 결과는?', example: '6.25 전쟁의 원인과 결과는?', bloom: '분석', bloomEmoji: '🔍' },
    { id: 'so2', frame: '[정책]이 사람들의 삶에 미친 영향은?', example: '이 정책이 삶에 미친 영향은?', bloom: '평가', bloomEmoji: '⚖️' },
    { id: 'so3', frame: '[문화A]와 [문화B]를 비교하면?', example: '동서양 문화를 비교하면?', bloom: '분석', bloomEmoji: '🔍' },
    { id: 'so4', frame: '만약 [사건]이 없었다면?', example: '만약 산업혁명이 없었다면?', bloom: '창의', bloomEmoji: '🌟' },
    { id: 'so5', frame: '[문제]를 해결하기 위한 방법은?', example: '환경 문제 해결 방법은?', bloom: '창의', bloomEmoji: '🌟' },
  ],
  영어: [
    { id: 'e1', frame: 'Why does [subject] [verb]?', example: 'Why does the author use this metaphor?', bloom: '분석', bloomEmoji: '🔍' },
    { id: 'e2', frame: 'What would happen if [condition]?', example: 'What would happen if we recycled more?', bloom: '창의', bloomEmoji: '🌟' },
    { id: 'e3', frame: 'How does [A] differ from [B]?', example: 'How does British differ from American English?', bloom: '분석', bloomEmoji: '🔍' },
    { id: 'e4', frame: 'What evidence supports [claim]?', example: 'What evidence supports climate change?', bloom: '평가', bloomEmoji: '⚖️' },
  ],
};

const SUBJECTS = Object.keys(TEMPLATES);

const bloomColors: Record<string, string> = {
  기억: '#6b7280', 이해: '#3b82f6', 적용: '#10b981',
  분석: '#6366f1', 평가: '#f59e0b', 창의: '#ef4444',
};

const QuestionTemplatePanel: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('전체');

  const allBlooms = ['전체', '기억', '이해', '적용', '분석', '평가', '창의'];

  const templates = selectedSubject ? TEMPLATES[selectedSubject] ?? [] : [];
  const filtered = filter === '전체' ? templates : templates.filter(t => t.bloom === filter);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 2px 10px rgba(99,102,241,0.07)',
    border: '1px solid #ede9ff',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>📋</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3730a3', margin: '0 0 6px' }}>주제별 질문 템플릿</h2>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>과목을 선택하고 질문 프레임을 활용해 보세요!</p>
      </div>

      {/* Subject Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {SUBJECTS.map(s => (
          <button
            key={s}
            onClick={() => { setSelectedSubject(s); setFilter('전체'); }}
            style={{
              padding: '8px 18px', borderRadius: '99px', fontWeight: 700,
              fontSize: '0.85rem', cursor: 'pointer', border: 'none',
              background: selectedSubject === s ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f3f4f6',
              color: selectedSubject === s ? '#fff' : '#374151',
              transition: 'all 0.2s',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {!selectedSubject && (
        <div style={{ ...card, textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>☝️</div>
          <div style={{ fontWeight: 600 }}>위에서 과목을 선택해 주세요</div>
        </div>
      )}

      {selectedSubject && (
        <>
          {/* Bloom Filter */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {allBlooms.map(b => (
              <button
                key={b}
                onClick={() => setFilter(b)}
                style={{
                  padding: '5px 12px', borderRadius: '99px', fontSize: '0.75rem',
                  fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: filter === b ? (b === '전체' ? '#6366f1' : bloomColors[b] ?? '#6366f1') : '#f3f4f6',
                  color: filter === b ? '#fff' : '#6b7280',
                }}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Templates */}
          {filtered.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '30px', color: '#9ca3af' }}>이 분류에 해당하는 템플릿이 없습니다.</div>
          ) : (
            filtered.map(t => (
              <div key={t.id} style={{ ...card, borderLeft: `4px solid ${bloomColors[t.bloom] ?? '#6366f1'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1f2937', marginBottom: '6px' }}>
                      {t.frame}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '8px' }}>
                      예시: {t.example}
                    </div>
                    <span style={{
                      fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px',
                      background: `${bloomColors[t.bloom]}20`,
                      color: bloomColors[t.bloom] ?? '#6366f1',
                      fontWeight: 700,
                    }}>
                      {t.bloomEmoji} {t.bloom}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(t.frame, t.id)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontWeight: 700,
                      fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0,
                      border: 'none',
                      background: copiedId === t.id ? '#10b981' : '#6366f1',
                      color: '#fff',
                      transition: 'background 0.3s',
                    }}
                  >
                    {copiedId === t.id ? '✅ 복사됨' : '📋 복사'}
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
};

export default QuestionTemplatePanel;
