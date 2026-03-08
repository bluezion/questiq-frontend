// src/components/diagnostic/ConstructScoreBar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 구인별 사전-사후 비교 가로 바 차트 컴포넌트
// 향상/감소를 색으로 표현, 좌우 레이블로 점수 표기
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { ConstructComparison } from '../../types/diagnostic';
import { getConstructMeta } from '../../data/diagnosticData';

interface ConstructScoreBarProps {
  comparisons: ConstructComparison[];
  showAnimation?: boolean;
}

const ConstructScoreBar: React.FC<ConstructScoreBarProps> = ({
  comparisons, showAnimation = true,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {comparisons.map((comp) => {
        const meta = getConstructMeta(comp.constructId);
        const improved = comp.improvement > 0;
        const declined = comp.improvement < 0;
        const significant = comp.isSignificant;

        const prePct  = Math.round(((comp.preScore  - 1) / 4) * 100);
        const postPct = Math.round(((comp.postScore - 1) / 4) * 100);

        return (
          <div key={comp.constructId} style={barStyles.row}>
            {/* ── 구인 레이블 ─────────────────────── */}
            <div style={barStyles.labelArea}>
              <span style={{ fontSize: '16px' }}>{meta.emoji}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                  {meta.label}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {meta.description.slice(0, 18)}…
                </div>
              </div>
            </div>

            {/* ── 바 영역 ────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {/* 사전 바 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={barStyles.typeLabel}>사전</span>
                <div style={barStyles.barBg}>
                  <div style={{
                    width: showAnimation ? `${prePct}%` : `${prePct}%`,
                    height: '100%',
                    background: '#93c5fd',
                    borderRadius: '6px',
                    transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }} />
                </div>
                <span style={{ ...barStyles.scoreLabel, color: '#3b82f6' }}>
                  {comp.preScore.toFixed(1)}
                </span>
              </div>

              {/* 사후 바 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ ...barStyles.typeLabel, color: '#7c3aed' }}>사후</span>
                <div style={barStyles.barBg}>
                  <div style={{
                    width: `${postPct}%`,
                    height: '100%',
                    background: improved
                      ? `linear-gradient(90deg,#8b5cf6,#6366f1)`
                      : declined ? '#fca5a5' : '#c4b5fd',
                    borderRadius: '6px',
                    transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
                    boxShadow: significant && improved ? `0 2px 8px ${meta.color}44` : 'none',
                  }} />
                </div>
                <span style={{ ...barStyles.scoreLabel, color: '#7c3aed' }}>
                  {comp.postScore.toFixed(1)}
                </span>
              </div>
            </div>

            {/* ── 향상도 배지 ─────────────────────── */}
            <div style={{
              ...barStyles.impBadge,
              background: improved ? (significant ? '#f0fdf4' : '#f8fafc') : declined ? '#fef2f2' : '#f8fafc',
              border: `1.5px solid ${improved ? (significant ? '#86efac' : '#e2e8f0') : declined ? '#fca5a5' : '#e2e8f0'}`,
              color: improved ? (significant ? '#16a34a' : '#64748b') : declined ? '#dc2626' : '#94a3b8',
            }}>
              <span style={{ fontSize: '14px' }}>
                {improved ? (significant ? '⬆️' : '↑') : declined ? '⬇️' : '━'}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                {comp.improvement >= 0 ? '+' : ''}{comp.improvement.toFixed(2)}
              </span>
              {significant && improved && (
                <span style={{ fontSize: '10px', color: '#16a34a' }}>유의미!</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const barStyles: Record<string, React.CSSProperties> = {
  row: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#fafafa', borderRadius: '12px' },
  labelArea: { display: 'flex', alignItems: 'center', gap: '8px', width: '100px', flexShrink: 0 },
  typeLabel: { fontSize: '11px', fontWeight: 700, color: '#3b82f6', width: '24px', textAlign: 'right', flexShrink: 0 },
  barBg: { flex: 1, height: '14px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' },
  scoreLabel: { fontSize: '13px', fontWeight: 700, width: '28px', textAlign: 'right', flexShrink: 0 },
  impBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', padding: '6px 10px', borderRadius: '10px', minWidth: '58px', textAlign: 'center' },
};

export default ConstructScoreBar;
