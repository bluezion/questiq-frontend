// src/components/diagnostic/GrowthSummaryCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 성장 요약 카드 컴포넌트 (레이더 차트 페이지 상단 히어로 섹션)
// - 성장 등급 배지, 전체 향상 점수, 핵심 인사이트 3가지
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { DiagnosticComparison } from '../../types/diagnostic';
import { getConstructMeta, getGrowthInfo, getLevelInfo } from '../../data/diagnosticData';

interface GrowthSummaryCardProps {
  comparison: DiagnosticComparison;
}

const GrowthSummaryCard: React.FC<GrowthSummaryCardProps> = ({ comparison }) => {
  const growthInfo = getGrowthInfo(comparison.totalImprovement);
  const preLevelInfo  = getLevelInfo(comparison.pre.totalAverage);
  const postLevelInfo = getLevelInfo(comparison.post.totalAverage);
  const mostMeta = getConstructMeta(comparison.mostImprovedConstruct);
  const leastMeta = getConstructMeta(comparison.leastImprovedConstruct);
  const leastComp = comparison.constructComparisons.find(
    c => c.constructId === comparison.leastImprovedConstruct
  );

  const improved = comparison.totalImprovement > 0;

  // 그라디언트 결정
  const gradients: Record<string, string> = {
    remarkable:  'linear-gradient(135deg,#8b5cf6,#6366f1)',
    significant: 'linear-gradient(135deg,#6366f1,#3b82f6)',
    moderate:    'linear-gradient(135deg,#10b981,#06b6d4)',
    slight:      'linear-gradient(135deg,#f59e0b,#f97316)',
    declined:    'linear-gradient(135deg,#ef4444,#f97316)',
  };
  const gradient = gradients[comparison.overallGrowthLevel] ?? gradients.moderate;

  return (
    <div style={summaryStyles.wrapper}>
      {/* ── 헤어로 헤더 ───────────────────────────────── */}
      <div style={{ background: gradient, borderRadius: '18px 18px 0 0', padding: '28px 24px' }}>
        <div style={summaryStyles.headerRow}>
          {/* 성장 등급 */}
          <div style={summaryStyles.growthBadge}>
            <span style={{ fontSize: '40px' }}>{growthInfo.emoji}</span>
            <div>
              <div style={summaryStyles.growthLabel}>{growthInfo.label}</div>
              <div style={summaryStyles.growthSub}>
                전체 향상: {comparison.totalImprovement >= 0 ? '+' : ''}
                {comparison.totalImprovement.toFixed(2)}점
                ({comparison.totalImprovementPct >= 0 ? '+' : ''}
                {comparison.totalImprovementPct}%)
              </div>
            </div>
          </div>

          {/* 사전 → 사후 레벨 이동 */}
          <div style={summaryStyles.levelFlow}>
            <div style={summaryStyles.levelBox}>
              <div style={summaryStyles.levelEmoji}>{preLevelInfo.emoji}</div>
              <div style={summaryStyles.levelName}>{preLevelInfo.label}</div>
              <div style={summaryStyles.levelScore}>{comparison.pre.totalAverage.toFixed(2)}</div>
            </div>
            <div style={summaryStyles.arrow}>→</div>
            <div style={{ ...summaryStyles.levelBox, background: 'rgba(255,255,255,0.25)', transform: 'scale(1.08)' }}>
              <div style={summaryStyles.levelEmoji}>{postLevelInfo.emoji}</div>
              <div style={summaryStyles.levelName}>{postLevelInfo.label}</div>
              <div style={summaryStyles.levelScore}>{comparison.post.totalAverage.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* 요약 메시지 */}
        <div style={summaryStyles.summaryMsg}>
          💬 {comparison.summary}
        </div>
      </div>

      {/* ── 3가지 핵심 인사이트 ──────────────────────── */}
      <div style={summaryStyles.insightsRow}>
        {/* 인사이트 1: 가장 많이 향상된 구인 */}
        <div style={{ ...summaryStyles.insightCard, borderTop: `3px solid ${mostMeta.color}` }}>
          <div style={summaryStyles.insightIcon}>{mostMeta.emoji}</div>
          <div style={summaryStyles.insightTitle}>가장 많이 성장</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: mostMeta.color }}>
            {mostMeta.label}
          </div>
          <div style={summaryStyles.insightScore}>
            {comparison.constructComparisons
              .find(c => c.constructId === mostMeta.id)
              ?.improvement.toFixed(2)}점 향상
          </div>
        </div>

        {/* 인사이트 2: 성찰 날짜 */}
        <div style={{ ...summaryStyles.insightCard, borderTop: '3px solid #94a3b8' }}>
          <div style={summaryStyles.insightIcon}>📅</div>
          <div style={summaryStyles.insightTitle}>진단 기간</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
            {formatDateDiff(comparison.pre.completedAt, comparison.post.completedAt)}
          </div>
          <div style={summaryStyles.insightScore}>
            {new Date(comparison.pre.completedAt).toLocaleDateString('ko-KR')} ~
            {new Date(comparison.post.completedAt).toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* 인사이트 3: 더 개선할 구인 */}
        <div style={{ ...summaryStyles.insightCard, borderTop: `3px solid ${leastMeta.color}` }}>
          <div style={summaryStyles.insightIcon}>{leastMeta.emoji}</div>
          <div style={summaryStyles.insightTitle}>
            {(leastComp?.improvement ?? 0) >= 0 ? '계속 도전' : '재도전 필요'}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: leastMeta.color }}>
            {leastMeta.label}
          </div>
          <div style={summaryStyles.insightScore}>
            {(leastComp?.improvement ?? 0) >= 0
              ? '더 성장할 여지 있음'
              : `${Math.abs(leastComp?.improvement ?? 0).toFixed(2)}점 감소`}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatDateDiff(startIso: string, endIso: string): string {
  const diff = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return '당일 진단';
  if (diff < 7) return `${diff}일 후`;
  if (diff < 30) return `${Math.round(diff / 7)}주 후`;
  return `${Math.round(diff / 30)}개월 후`;
}

const summaryStyles: Record<string, React.CSSProperties> = {
  wrapper: { background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' },
  growthBadge: { display: 'flex', alignItems: 'center', gap: '14px' },
  growthLabel: { fontSize: '22px', fontWeight: 800, color: '#fff' },
  growthSub: { fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' },
  levelFlow: { display: 'flex', alignItems: 'center', gap: '12px' },
  levelBox: { background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px 14px', textAlign: 'center', minWidth: '80px' },
  levelEmoji: { fontSize: '20px' },
  levelName: { fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 },
  levelScore: { fontSize: '16px', fontWeight: 800, color: '#fff' },
  arrow: { fontSize: '20px', color: 'rgba(255,255,255,0.7)', fontWeight: 700 },
  summaryMsg: { fontSize: '14px', color: 'rgba(255,255,255,0.95)', lineHeight: 1.6, background: 'rgba(0,0,0,0.1)', padding: '12px 16px', borderRadius: '12px' },
  insightsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', borderTop: '1px solid #f1f5f9' },
  insightCard: { padding: '20px 16px', textAlign: 'center', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  insightIcon: { fontSize: '24px' },
  insightTitle: { fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  insightScore: { fontSize: '11px', color: '#94a3b8' },
};

export default GrowthSummaryCard;
