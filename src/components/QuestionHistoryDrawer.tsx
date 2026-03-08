// src/components/QuestionHistoryDrawer.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 질문 히스토리 사이드 드로어 컴포넌트
// - 최근 50개 질문 기록 표시
// - Bloom 레벨 필터링
// - 검색 기능
// - 히스토리 항목 클릭 시 결과 미리보기
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import type { QuestionHistory, BloomLevel } from '../types';
import { BLOOM_PALETTE, scoreToColor, formatDate } from '../utils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: QuestionHistory[];
  onSelect: (item: QuestionHistory) => void;
  onClearAll: () => void;
}

const BLOOM_LEVELS: (BloomLevel | '전체')[] = ['전체', '기억', '이해', '적용', '분석', '평가', '창의'];

const QuestionHistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen, onClose, history, onSelect, onClearAll,
}) => {
  const [search, setSearch] = useState('');
  const [filterBloom, setFilterBloom] = useState<BloomLevel | '전체'>('전체');

  const filtered = useMemo(() => {
    return history.filter((h) => {
      const matchSearch = search === '' || h.question.includes(search);
      const matchBloom = filterBloom === '전체' || h.result.bloom_level === filterBloom;
      return matchSearch && matchBloom;
    });
  }, [history, search, filterBloom]);

  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s',
          zIndex: 40,
        }}
      />

      {/* 드로어 */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '360px', maxWidth: '90vw',
        background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {/* 드로어 헤더 */}
        <div style={drawerStyles.header}>
          <div>
            <h3 style={drawerStyles.title}>📚 질문 히스토리</h3>
            <span style={drawerStyles.count}>{filtered.length}개 기록</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {history.length > 0 && (
              <button
                onClick={() => { if (window.confirm('히스토리를 모두 삭제할까요?')) onClearAll(); }}
                style={drawerStyles.clearBtn}
              >
                🗑 전체 삭제
              </button>
            )}
            <button onClick={onClose} style={drawerStyles.closeBtn} aria-label="닫기">✕</button>
          </div>
        </div>

        {/* 검색 */}
        <div style={drawerStyles.searchArea}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="질문 검색..."
            style={drawerStyles.searchInput}
          />
        </div>

        {/* Bloom 필터 */}
        <div style={drawerStyles.filterRow}>
          {BLOOM_LEVELS.map((level) => {
            const palette = level !== '전체' ? BLOOM_PALETTE[level] : null;
            const isActive = filterBloom === level;
            return (
              <button
                key={level}
                onClick={() => setFilterBloom(level)}
                style={{
                  padding: '4px 10px', borderRadius: '12px', border: 'none',
                  fontSize: '12px', fontWeight: isActive ? 700 : 400, cursor: 'pointer',
                  background: isActive ? (palette?.bar ?? '#6366f1') : '#f1f5f9',
                  color: isActive ? '#fff' : '#64748b',
                  transition: 'all 0.15s',
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                {level}
              </button>
            );
          })}
        </div>

        {/* 히스토리 리스트 */}
        <div style={drawerStyles.list}>
          {filtered.length === 0 ? (
            <div style={drawerStyles.empty}>
              {history.length === 0 ? '아직 분류한 질문이 없어요.' : '검색 결과가 없어요.'}
            </div>
          ) : (
            filtered.map((item) => {
              const palette = BLOOM_PALETTE[item.result.bloom_level] ?? BLOOM_PALETTE['기억'];
              return (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item); onClose(); }}
                  style={drawerStyles.historyItem}
                >
                  {/* 점수 원 */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: `${scoreToColor(item.result.score)}22`,
                    border: `2px solid ${scoreToColor(item.result.score)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: scoreToColor(item.result.score),
                  }}>
                    {item.result.score}
                  </div>

                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={drawerStyles.historyQ}>
                      {item.question.length > 45 ? item.question.slice(0, 45) + '…' : item.question}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 7px', borderRadius: '8px',
                        background: palette.light, color: palette.text, fontWeight: 600,
                      }}>
                        {item.result.bloom_emoji} {item.result.bloom_level}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {item.result.open_closed === 'open' ? '🔓' : '🔒'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
                        {formatDate(item.result.analyzed_at).split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

const drawerStyles: Record<string, React.CSSProperties> = {
  header: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' },
  title: { fontSize: '17px', fontWeight: 800, color: '#1e293b', margin: 0 },
  count: { fontSize: '12px', color: '#94a3b8' },
  clearBtn: { padding: '6px 10px', background: '#fef2f2', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontFamily: "'Noto Sans KR', sans-serif" },
  closeBtn: { width: '32px', height: '32px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#64748b' },
  searchArea: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9' },
  searchInput: { width: '100%', padding: '9px 12px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', fontFamily: "'Noto Sans KR', sans-serif", background: '#f8fafc' },
  filterRow: { display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px 16px', borderBottom: '1px solid #f1f5f9' },
  list: { flex: 1, overflowY: 'auto', padding: '8px' },
  empty: { padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
  historyItem: { width: '100%', display: 'flex', gap: '10px', alignItems: 'center', padding: '12px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', marginBottom: '6px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', fontFamily: "'Noto Sans KR', sans-serif" },
  historyQ: { fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: 0, lineHeight: 1.5 },
};

export default QuestionHistoryDrawer;
