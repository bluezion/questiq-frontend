// src/components/ClassifyResultCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 질문 분류 결과 표시 카드 컴포넌트
// - 레벨 배지, Bloom 레벨 게이지 바
// - 열린/닫힌 배지, 마르자노 타입 뱃지
// - 피드백 섹션, 개선된 질문 제안
// - 강점 태그, 다음 단계 힌트
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import type { ClassifyResult } from '../types';
import {
  BLOOM_PALETTE,
  BADGE_STYLES,
  MARZANO_INFO,
  OPEN_CLOSED_STYLE,
  scoreToColor,
  scoreToPercent,
  formatDate,
} from '../utils';

interface ClassifyResultCardProps {
  result: ClassifyResult;
  onReAnalyze?: () => void;
  onCopyImproved?: () => void;
  showMeta?: boolean;
  tokensUsed?: number;
  elapsedMs?: number;
}

const ClassifyResultCard: React.FC<ClassifyResultCardProps> = ({
  result,
  onReAnalyze,
  showMeta = true,
  tokensUsed,
  elapsedMs,
}) => {
  const [copiedImproved, setCopiedImproved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('feedback');

  const bloomPalette = BLOOM_PALETTE[result.bloom_level] ?? BLOOM_PALETTE['기억'];
  const badgeStyle = BADGE_STYLES[result.level_badge] ?? BADGE_STYLES['씨앗형'];
  const marzanoInfo = MARZANO_INFO[result.marzano_type] ?? MARZANO_INFO['detail'];
  const ocStyle = OPEN_CLOSED_STYLE[result.open_closed] ?? OPEN_CLOSED_STYLE['closed'];

  const handleCopyImproved = async () => {
    await navigator.clipboard.writeText(result.improved_question);
    setCopiedImproved(true);
    setTimeout(() => setCopiedImproved(false), 2000);
  };

  const toggleSection = (key: string) =>
    setExpandedSection(expandedSection === key ? null : key);

  return (
    <div style={cardStyles.wrapper}>
      {/* ── 헤더: 레벨 배지 + 점수 ─────────────────── */}
      <div style={{
        ...cardStyles.header,
        background: badgeStyle.gradient,
        boxShadow: `0 4px 20px ${badgeStyle.shadow}`,
      }}>
        <div style={cardStyles.headerLeft}>
          <span style={cardStyles.badgeEmoji}>{result.level_badge_emoji}</span>
          <div>
            <div style={cardStyles.badgeName}>{result.level_badge}</div>
            <div style={cardStyles.originalQ}>
              "{result.original_question.length > 60
                ? result.original_question.slice(0, 60) + '…'
                : result.original_question}"
            </div>
          </div>
        </div>

        {/* 점수 원형 게이지 */}
        <div style={cardStyles.scoreCircle}>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="6" />
            <circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeDasharray={`${result.score * 18.85} 188.5`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          <div style={cardStyles.scoreText}>
            <span style={{ fontSize: '22px', fontWeight: 800 }}>{result.score}</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>/10</span>
          </div>
        </div>
      </div>

      {/* ── 분류 배지 행 ─────────────────────────────── */}
      <div style={cardStyles.badgeRow}>
        {/* 열린/닫힌 배지 */}
        <div style={{
          ...cardStyles.badge,
          background: ocStyle.bg,
          border: `1.5px solid ${ocStyle.border}`,
          color: ocStyle.text,
        }}>
          <span>{ocStyle.icon}</span>
          <span>{ocStyle.label}</span>
        </div>

        {/* Bloom 레벨 배지 */}
        <div style={{
          ...cardStyles.badge,
          background: bloomPalette.light,
          border: `1.5px solid ${bloomPalette.border}`,
          color: bloomPalette.text,
        }}>
          <span>{result.bloom_emoji}</span>
          <span>Bloom: {result.bloom_level}</span>
          <span style={{ fontSize: '11px', opacity: 0.7 }}>Lv.{result.bloom_level_num}</span>
        </div>

        {/* 마르자노 배지 */}
        <div style={{
          ...cardStyles.badge,
          background: '#f8fafc',
          border: `1.5px solid ${marzanoInfo.color}33`,
          color: marzanoInfo.color,
        }}>
          <span>📊</span>
          <span>{marzanoInfo.ko}</span>
        </div>
      </div>

      {/* ── Bloom 6단계 시각적 게이지 ────────────────── */}
      <div style={cardStyles.section}>
        <div style={cardStyles.sectionTitle}>Bloom's Taxonomy 위치</div>
        <div style={cardStyles.bloomBar}>
          {(['기억','이해','적용','분석','평가','창의'] as const).map((level, i) => {
            const palette = BLOOM_PALETTE[level];
            const isActive = i + 1 <= result.bloom_level_num;
            const isCurrent = level === result.bloom_level;
            return (
              <div
                key={level}
                title={level}
                style={{
                  flex: 1,
                  height: isCurrent ? '42px' : '32px',
                  background: isActive ? palette.bar : '#e2e8f0',
                  borderRadius: i === 0 ? '8px 0 0 8px' : i === 5 ? '0 8px 8px 0' : '0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.4s ease',
                  cursor: 'default',
                  position: 'relative',
                  boxShadow: isCurrent ? `0 2px 8px ${palette.bar}66` : 'none',
                }}
              >
                <span style={{ fontSize: '10px', color: isActive ? '#fff' : '#94a3b8', fontWeight: isCurrent ? 700 : 400 }}>
                  {level}
                </span>
                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    fontSize: '11px',
                    background: palette.bar,
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    fontWeight: 700,
                  }}>
                    현재 수준 ▼
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {result.bloom_reason && (
          <p style={cardStyles.reasonText}>📌 {result.bloom_reason}</p>
        )}
      </div>

      {/* ── 점수 게이지 바 ─────────────────────────── */}
      <div style={cardStyles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={cardStyles.sectionTitle}>종합 점수</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: scoreToColor(result.score) }}>
            {result.score}점
          </span>
        </div>
        <div style={cardStyles.scoreBarBg}>
          <div style={{
            width: scoreToPercent(result.score),
            height: '100%',
            background: `linear-gradient(90deg, ${scoreToColor(result.score)}, ${scoreToColor(result.score)}cc)`,
            borderRadius: '8px',
            transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }} />
        </div>
        <div style={cardStyles.scoreLabels}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <span key={n} style={{
              fontSize: '10px',
              color: n <= result.score ? scoreToColor(result.score) : '#e2e8f0',
              fontWeight: n === result.score ? 700 : 400,
            }}>{n}</span>
          ))}
        </div>
      </div>

      {/* ── 피드백 (접기/펼치기) ─────────────────── */}
      <AccordionSection
        title="🎯 AI 피드백"
        isOpen={expandedSection === 'feedback'}
        onToggle={() => toggleSection('feedback')}
        accent="#6366f1"
      >
        <p style={cardStyles.feedbackText}>{result.feedback}</p>
        {result.strengths.length > 0 && (
          <div style={cardStyles.strengthsRow}>
            {result.strengths.map((s, i) => (
              <span key={i} style={cardStyles.strengthChip}>✨ {s}</span>
            ))}
          </div>
        )}
      </AccordionSection>

      {/* ── 개선된 질문 ────────────────────────────── */}
      <AccordionSection
        title="💡 개선된 질문 제안"
        isOpen={expandedSection === 'improve'}
        onToggle={() => toggleSection('improve')}
        accent="#10b981"
      >
        <div style={cardStyles.improvedBox}>
          <p style={cardStyles.improvedQ}>"{result.improved_question}"</p>
          <button onClick={handleCopyImproved} style={cardStyles.copyBtn}>
            {copiedImproved ? '✅ 복사됨!' : '📋 복사'}
          </button>
        </div>
        {result.improvement_tip && (
          <p style={cardStyles.tipText}>💬 {result.improvement_tip}</p>
        )}
      </AccordionSection>

      {/* ── 다음 단계 제안 ─────────────────────────── */}
      {(result.next_bloom_suggestion || result.hint) && (
        <AccordionSection
          title="🚀 다음 단계로 도약하기"
          isOpen={expandedSection === 'next'}
          onToggle={() => toggleSection('next')}
          accent="#f59e0b"
        >
          {result.next_bloom_suggestion && (
            <div style={cardStyles.nextBox}>
              <span style={cardStyles.nextLabel}>다음 레벨 질문 예시</span>
              <p style={{ margin: '4px 0', color: '#1e293b', fontSize: '14px' }}>
                "{result.next_bloom_suggestion}"
              </p>
            </div>
          )}
          {result.hint && (
            <p style={cardStyles.hintText}>🗺 {result.hint}</p>
          )}
        </AccordionSection>
      )}

      {/* ── 메타 정보 ──────────────────────────────── */}
      {showMeta && (
        <div style={cardStyles.meta}>
          <span>🕐 {formatDate(result.analyzed_at)}</span>
          {tokensUsed && <span>🔤 {tokensUsed}토큰</span>}
          {elapsedMs && <span>⚡ {(elapsedMs / 1000).toFixed(1)}초</span>}
          {result.grade !== '기타' && <span>📚 {result.grade}</span>}
          {result.subject !== '일반' && <span>📖 {result.subject}</span>}
        </div>
      )}

      {/* ── 재분석 버튼 ────────────────────────────── */}
      {onReAnalyze && (
        <button onClick={onReAnalyze} style={cardStyles.reAnalyzeBtn}>
          🔄 다시 분석
        </button>
      )}
    </div>
  );
};

// ── 접기/펼치기 섹션 컴포넌트 ─────────────────────────
const AccordionSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  accent?: string;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, accent = '#6366f1', children }) => (
  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        padding: '12px 16px',
        background: isOpen ? '#fafafa' : '#fff',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: 600,
        color: isOpen ? accent : '#64748b',
        transition: 'all 0.2s',
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <span>{title}</span>
      <span style={{
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
        transition: 'transform 0.2s',
        color: '#94a3b8',
      }}>▼</span>
    </button>
    {isOpen && (
      <div style={{ padding: '12px 16px', background: '#fafafa', borderTop: `2px solid ${accent}22` }}>
        {children}
      </div>
    )}
  </div>
);

// ── 스타일 ─────────────────────────────────────────────
const cardStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: '#fff',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  header: {
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  badgeEmoji: { fontSize: '36px' },
  badgeName: { fontSize: '18px', fontWeight: 800, color: '#1e293b' },
  originalQ: { fontSize: '12px', color: '#64748b', marginTop: '2px', fontStyle: 'italic' },
  scoreCircle: { position: 'relative', width: '72px', height: '72px', flexShrink: 0 },
  scoreText: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex', alignItems: 'baseline', gap: '1px',
    color: '#1e293b',
  },
  badgeRow: {
    display: 'flex', flexWrap: 'wrap', gap: '8px',
    padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
  },
  badge: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px', borderRadius: '20px',
    fontSize: '13px', fontWeight: 600,
  },
  section: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9' },
  sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' },
  bloomBar: { display: 'flex', gap: '3px', marginBottom: '8px', alignItems: 'flex-end', height: '50px' },
  reasonText: { fontSize: '12px', color: '#64748b', margin: '8px 0 0', lineHeight: 1.6 },
  scoreBarBg: { height: '12px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', marginBottom: '6px' },
  scoreLabels: { display: 'flex', justifyContent: 'space-between', padding: '0 2px' },
  feedbackText: { fontSize: '14px', lineHeight: 1.8, color: '#374151', margin: '0 0 8px' },
  strengthsRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  strengthChip: { padding: '4px 10px', background: '#ede9fe', color: '#5b21b6', borderRadius: '12px', fontSize: '12px', fontWeight: 600 },
  improvedBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', background: '#f0fdf4', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px' },
  improvedQ: { fontSize: '14px', lineHeight: 1.7, color: '#065f46', fontWeight: 600, margin: 0, flex: 1 },
  copyBtn: { padding: '5px 12px', background: '#fff', border: '1.5px solid #86efac', borderRadius: '8px', color: '#16a34a', cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: "'Noto Sans KR', sans-serif" },
  tipText: { fontSize: '13px', color: '#059669', margin: 0 },
  nextBox: { background: '#fffbeb', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', borderLeft: '3px solid #f59e0b' },
  nextLabel: { fontSize: '11px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' },
  hintText: { fontSize: '13px', color: '#78716c', margin: 0 },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '12px 20px', background: '#f8fafc', fontSize: '12px', color: '#94a3b8' },
  reAnalyzeBtn: { margin: '0 20px 20px', padding: '10px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '10px', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontFamily: "'Noto Sans KR', sans-serif" },
};

export default ClassifyResultCard;
