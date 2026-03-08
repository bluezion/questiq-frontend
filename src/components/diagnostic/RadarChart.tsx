// src/components/diagnostic/RadarChart.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 순수 SVG 레이더 차트 엔진 — 외부 라이브러리 Zero
//
// 설계 원칙:
//  • 6각형 그리드 (N개 축 자동 계산)
//  • 사전(파랑)/사후(보라) 두 폴리곤 오버레이
//  • mount 시 clip-path 애니메이션으로 폴리곤 성장 효과
//  • 각 축 끝점에 점수 버블 표시
//  • 호버 시 툴팁 (구인명, 사전/사후, 향상도)
//  • 반응형 viewBox (부모 컨테이너에 맞게 자동 조절)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import type { RadarDataPoint } from '../../types/diagnostic';
import { CONSTRUCTS } from '../../data/diagnosticData';

// ══════════════════════════════════════════════════════
//  타입
// ══════════════════════════════════════════════════════
interface RadarChartProps {
  dataPoints: RadarDataPoint[];   // 6개 구인 데이터
  size?: number;                  // SVG 정사각형 크기 (px)
  showLegend?: boolean;
  showTooltip?: boolean;
  animateOnMount?: boolean;
  preLabel?: string;
  postLabel?: string;
  showOnlyPre?: boolean;          // 사전만 표시 (사후 미완성 시)
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  constructId: string;
  preScore: number;
  postScore: number;
  improvement: number;
}

// ══════════════════════════════════════════════════════
//  수학 헬퍼
// ══════════════════════════════════════════════════════

/** 각도(도)를 [cx,cy] 중심으로 radius 거리의 SVG 좌표로 변환 */
function polarToCartesian(
  cx: number, cy: number,
  radius: number,
  angleDeg: number
): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [
    cx + radius * Math.cos(rad),
    cy + radius * Math.sin(rad),
  ];
}

/** 정규화 점수(0~100) → 반지름 (0~maxRadius) */
function scoreToRadius(score: number, maxRadius: number): number {
  return (Math.min(Math.max(score, 0), 100) / 100) * maxRadius;
}

/** 폴리곤 path 문자열 생성 */
function buildPolygonPath(
  cx: number, cy: number,
  points: number[],    // 각 축의 반지름값
  maxRadius: number,
  n: number
): string {
  const coords = points.map((r, i) => {
    const angle = (360 / n) * i;
    const [x, y] = polarToCartesian(cx, cy, scoreToRadius(r, maxRadius), angle);
    return `${x},${y}`;
  });
  return `M${coords.join('L')}Z`;
}

// ══════════════════════════════════════════════════════
//  컴포넌트
// ══════════════════════════════════════════════════════
const RadarChart: React.FC<RadarChartProps> = ({
  dataPoints,
  size = 400,
  showLegend = true,
  showTooltip = true,
  animateOnMount = true,
  preLabel = '사전 진단',
  postLabel = '사후 진단',
  showOnlyPre = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [animated, setAnimated] = useState(!animateOnMount);

  // 마운트 시 애니메이션 트리거
  useEffect(() => {
    if (!animateOnMount) return;
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [animateOnMount]);

  // ── 기하학 계산 ────────────────────────────────────
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.36;   // 차트 반지름 (여백 고려)
  const n = dataPoints.length;     // 축 개수 (=6)
  const gridLevels = [20, 40, 60, 80, 100]; // 그리드 단계

  // 축 좌표 사전 계산
  const axisEndPoints = useMemo(
    () => dataPoints.map((_, i) => {
      const angle = (360 / n) * i;
      return polarToCartesian(cx, cy, maxRadius, angle);
    }),
    [dataPoints, cx, cy, maxRadius, n]
  );

  // 레이블 위치 (축 끝보다 조금 더 바깥)
  const labelPositions = useMemo(
    () => dataPoints.map((_, i) => {
      const angle = (360 / n) * i;
      return polarToCartesian(cx, cy, maxRadius + 30, angle);
    }),
    [dataPoints, cx, cy, maxRadius, n]
  );

  // 폴리곤 경로
  const preScores  = dataPoints.map((d) => d.preScore);
  const postScores = dataPoints.map((d) => d.postScore);

  const prePath  = buildPolygonPath(cx, cy, preScores,  maxRadius, n);
  const postPath = buildPolygonPath(cx, cy, postScores, maxRadius, n);

  // ── 툴팁 핸들러 ────────────────────────────────────
  const handleMouseEnter = useCallback((
    e: React.MouseEvent<SVGCircleElement>,
    dp: RadarDataPoint
  ) => {
    if (!showTooltip) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 10,
      constructId: dp.constructId,
      preScore: dp.preScore,
      postScore: dp.postScore,
      improvement: dp.postScore - dp.preScore,
    });
  }, [showTooltip]);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  // ── 렌더 ───────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>

      {/* ── SVG 차트 본체 ─────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: `${size}px` }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${size} ${size}`}
          style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          aria-label="질문 역량 레이더 차트"
        >
          <defs>
            {/* 사전 그라디언트 */}
            <radialGradient id="preGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </radialGradient>
            {/* 사후 그라디언트 */}
            <radialGradient id="postGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
            </radialGradient>
            {/* 드롭 섀도 필터 */}
            <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
            </filter>
            {/* 폴리곤 클립 애니메이션용 마스크 */}
            <clipPath id="radarClip">
              <circle
                cx={cx} cy={cy}
                r={animated ? maxRadius + 50 : 0}
                style={{ transition: 'r 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />
            </clipPath>
          </defs>

          {/* ── 동심 그리드 폴리곤 ──────────────────── */}
          {gridLevels.map((level) => {
            const pts = Array(n).fill(level);
            const path = buildPolygonPath(cx, cy, pts, maxRadius, n);
            return (
              <path
                key={level}
                d={path}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={level === 100 ? 1.5 : 1}
                strokeDasharray={level < 100 ? '4,3' : 'none'}
              />
            );
          })}

          {/* ── 그리드 레벨 레이블 (오른쪽 축 기준) ─ */}
          {gridLevels.map((level) => {
            const [lx, ly] = polarToCartesian(cx, cy, scoreToRadius(level, maxRadius), 0);
            return (
              <text
                key={`label-${level}`}
                x={lx + 4} y={ly + 4}
                fontSize="9"
                fill="#94a3b8"
                textAnchor="start"
              >
                {level}
              </text>
            );
          })}

          {/* ── 축 선 ──────────────────────────────── */}
          {axisEndPoints.map(([ax, ay], i) => (
            <line
              key={`axis-${i}`}
              x1={cx} y1={cy}
              x2={ax} y2={ay}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}

          {/* ── 데이터 폴리곤 (클립 마스크 적용) ───── */}
          <g clipPath="url(#radarClip)">
            {/* 사전 폴리곤 */}
            <path
              d={prePath}
              fill="url(#preGradient)"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinejoin="round"
              style={{ transition: 'd 0.5s ease' }}
            />

            {/* 사후 폴리곤 */}
            {!showOnlyPre && (
              <path
                d={postPath}
                fill="url(#postGradient)"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinejoin="round"
                style={{ transition: 'd 0.5s ease' }}
              />
            )}
          </g>

          {/* ── 축 레이블 + 이모지 ─────────────────── */}
          {dataPoints.map((dp, i) => {
            const [lx, ly] = labelPositions[i];
            const angle = (360 / n) * i;
            const isTop    = angle < 30 || angle > 330;
            const isBottom = angle > 150 && angle < 210;
            const isRight  = angle >= 30 && angle <= 150;
            const isLeft   = angle >= 210 && angle <= 330;

            const anchor = isRight ? 'start' : isLeft ? 'end' : 'middle';
            const dyEmoji = isBottom ? 16 : -6;
            const dyLabel = isBottom ? 29 : isTop ? -14 : 6;

            return (
              <g key={dp.constructId}>
                <text
                  x={lx} y={ly + dyEmoji}
                  fontSize="16"
                  textAnchor={anchor}
                  dominantBaseline="middle"
                >
                  {dp.emoji}
                </text>
                <text
                  x={lx} y={ly + dyLabel}
                  fontSize="11"
                  fontWeight="700"
                  fill="#334155"
                  textAnchor={anchor}
                  fontFamily="'Noto Sans KR', sans-serif"
                >
                  {dp.labelShort}
                </text>
              </g>
            );
          })}

          {/* ── 사전 점수 버블 ─────────────────────── */}
          {dataPoints.map((dp, i) => {
            const angle = (360 / n) * i;
            const r = scoreToRadius(dp.preScore, maxRadius);
            const [bx, by] = polarToCartesian(cx, cy, r, angle);
            return (
              <g key={`pre-dot-${i}`}>
                <circle
                  cx={bx} cy={by} r="5"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  filter="url(#dotShadow)"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => handleMouseEnter(e, dp)}
                  onMouseLeave={handleMouseLeave}
                />
              </g>
            );
          })}

          {/* ── 사후 점수 버블 ─────────────────────── */}
          {!showOnlyPre && dataPoints.map((dp, i) => {
            const angle = (360 / n) * i;
            const r = scoreToRadius(dp.postScore, maxRadius);
            const [bx, by] = polarToCartesian(cx, cy, r, angle);
            const improved = dp.postScore > dp.preScore;
            return (
              <g key={`post-dot-${i}`}>
                {/* 향상 시 pulse 링 */}
                {improved && (
                  <circle
                    cx={bx} cy={by} r="10"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1"
                    strokeOpacity="0.4"
                  />
                )}
                <circle
                  cx={bx} cy={by} r="6"
                  fill="#8b5cf6"
                  stroke="white"
                  strokeWidth="2"
                  filter="url(#dotShadow)"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => handleMouseEnter(e, dp)}
                  onMouseLeave={handleMouseLeave}
                />
                {/* 향상 화살표 */}
                {improved && (
                  <text
                    x={bx + 9} y={by - 6}
                    fontSize="9"
                    fill="#16a34a"
                    fontWeight="bold"
                  >
                    ▲
                  </text>
                )}
              </g>
            );
          })}

          {/* ── 중심 원 ────────────────────────────── */}
          <circle cx={cx} cy={cy} r="4" fill="#e2e8f0" />
        </svg>

        {/* ── 툴팁 ──────────────────────────────────── */}
        {tooltip && showTooltip && (
          <div style={{
            position: 'absolute',
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            background: 'rgba(15,23,42,0.92)',
            color: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            lineHeight: 1.7,
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: '140px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '13px' }}>
              {CONSTRUCTS.find(c => c.id === tooltip.constructId)?.label}
            </div>
            <div style={{ color: '#93c5fd' }}>
              {preLabel}: <strong>{tooltip.preScore}</strong>점
            </div>
            {!showOnlyPre && (
              <>
                <div style={{ color: '#c4b5fd' }}>
                  {postLabel}: <strong>{tooltip.postScore}</strong>점
                </div>
                <div style={{
                  marginTop: '4px',
                  color: tooltip.improvement >= 0 ? '#86efac' : '#fca5a5',
                  fontWeight: 700,
                }}>
                  {tooltip.improvement >= 0 ? '▲' : '▼'}{' '}
                  {Math.abs(tooltip.improvement)}점{' '}
                  {tooltip.improvement >= 0 ? '향상' : '감소'}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── 범례 ────────────────────────────────────── */}
      {showLegend && (
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <LegendItem color="#3b82f6" label={preLabel} dotStyle="filled" />
          {!showOnlyPre && (
            <LegendItem color="#8b5cf6" label={postLabel} dotStyle="filled" />
          )}
        </div>
      )}
    </div>
  );
};

const LegendItem: React.FC<{
  color: string; label: string; dotStyle?: 'filled' | 'outline';
}> = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#475569' }}>
    <div style={{
      width: '28px', height: '3px',
      background: color, borderRadius: '2px',
    }} />
    <div style={{
      width: '8px', height: '8px', borderRadius: '50%',
      background: color, border: '2px solid white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
    <span style={{ fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
  </div>
);

export default RadarChart;
