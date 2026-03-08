// src/components/teacher/ClassStatsPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 클래스 전체 통계 패널 - 대시보드 상단 요약
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from 'react';
import type { ClassStats } from '../../types/teacher';
import type { StudentRecord } from '../../types/teacher';
import type { RadarDataPoint } from '../../types/diagnostic';
import { CONSTRUCTS, getGrowthInfo } from '../../data/diagnosticData';
import RadarChart from '../diagnostic/RadarChart';

interface ClassStatsPanelProps {
  stats: ClassStats;
  students: StudentRecord[];
}

const ClassStatsPanel: React.FC<ClassStatsPanelProps> = ({ stats, students }) => {
  const growthInfo = getGrowthInfo(stats.avgImprovement);

  // 클래스 평균 레이더 데이터
  const classRadarData: RadarDataPoint[] = useMemo(() => {
    return CONSTRUCTS.map(c => ({
      constructId: c.id,
      label: c.label,
      labelShort: c.labelShort,
      emoji: c.emoji,
      color: c.color,
      lightColor: c.lightColor,
      preScore: Math.round(((stats.constructAvgPre[c.id] - 1) / 4) * 100),
      postScore: Math.round(((stats.constructAvgPost[c.id] - 1) / 4) * 100),
    }));
  }, [stats]);

  const topConstruct = CONSTRUCTS.find(c => c.id === stats.topImprovedConstruct);

  return (
    <div style={s.wrapper}>
      {/* ── 상단: KPI 4개 ─────────────────────────── */}
      <div style={s.kpiRow}>
        <KpiCard
          icon="👥" label="전체 학생" value={String(stats.totalStudents)}
          sub="명 등록" color="#6366f1"
        />
        <KpiCard
          icon="✅" label="진단 완료" value={String(stats.completedBoth)}
          sub={`/ ${stats.totalStudents}명`} color="#10b981"
        />
        <KpiCard
          icon="📈" label="평균 향상" value={`+${stats.avgImprovement.toFixed(2)}`}
          sub={growthInfo.label} color={growthInfo.color}
        />
        <KpiCard
          icon={topConstruct?.emoji ?? '🏆'} label="최고 향상 구인"
          value={topConstruct?.labelShort ?? '—'} sub="클래스 평균" color="#f59e0b"
        />
      </div>

      {/* ── 본체: 레이더 + 구인 순위 ─────────────── */}
      <div style={s.body}>
        {/* 클래스 평균 레이더 */}
        <div style={s.radarBox}>
          <div style={s.sectionTitle}>📊 클래스 평균 역량 레이더</div>
          <RadarChart
            dataPoints={classRadarData}
            size={320}
            preLabel="사전 평균"
            postLabel="사후 평균"
            animateOnMount={true}
            showTooltip={true}
            showLegend={true}
            showOnlyPre={stats.completedBoth === 0}
          />
        </div>

        {/* 구인별 클래스 평균 */}
        <div style={s.constructRank}>
          <div style={s.sectionTitle}>🏅 구인별 클래스 평균 향상</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CONSTRUCTS.map(c => {
              const preAvg  = stats.constructAvgPre[c.id]  ?? 0;
              const postAvg = stats.constructAvgPost[c.id] ?? 0;
              const diff    = Math.round((postAvg - preAvg) * 100) / 100;
              const prePct  = Math.round(((preAvg  - 1) / 4) * 100);
              const postPct = Math.round(((postAvg - 1) / 4) * 100);
              const improved = diff > 0;

              return (
                <div key={c.id} style={s.rankRow}>
                  <span style={{ fontSize: '16px' }}>{c.emoji}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', width: '56px' }}>
                    {c.labelShort}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                      {/* 사전 */}
                      <div style={{ flex: prePct, height: '6px', background: '#93c5fd', borderRadius: '4px 0 0 4px', transition: 'flex 0.6s ease' }} />
                      <div style={{ flex: 100 - prePct, height: '6px', background: '#f1f5f9', borderRadius: '0 4px 4px 0' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {/* 사후 */}
                      <div style={{ flex: postPct, height: '6px', background: c.color, borderRadius: '4px 0 0 4px', transition: 'flex 0.6s ease' }} />
                      <div style={{ flex: 100 - postPct, height: '6px', background: '#f1f5f9', borderRadius: '0 4px 4px 0' }} />
                    </div>
                  </div>
                  <div style={{
                    fontSize: '13px', fontWeight: 800, minWidth: '44px', textAlign: 'right',
                    color: improved ? '#16a34a' : '#ef4444',
                  }}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 완료율 프로그레스 */}
          <div style={s.completionBox}>
            <div style={s.sectionTitle}>진단 완료율</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '10px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${stats.totalStudents ? (stats.completedBoth / stats.totalStudents) * 100 : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                  borderRadius: '6px',
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#6366f1', minWidth: '40px' }}>
                {stats.totalStudents ? Math.round((stats.completedBoth / stats.totalStudents) * 100) : 0}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <LegendDot color="#6366f1" label={`사전+사후: ${stats.completedBoth}명`} />
              <LegendDot color="#93c5fd" label={`사전만: ${stats.completedPre - stats.completedBoth}명`} />
              <LegendDot color="#e2e8f0" label={`미완료: ${stats.totalStudents - stats.completedPre}명`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ icon: string; label: string; value: string; sub: string; color: string }> = ({ icon, label, value, sub, color }) => (
  <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flex: 1, border: `1.5px solid ${color}22` }}>
    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    <div style={{ fontSize: '22px', fontWeight: 800, color, marginTop: '2px' }}>{value}</div>
    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>
  </div>
);

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
    <span style={{ fontSize: '11px', color: '#64748b' }}>{label}</span>
  </div>
);

const s: Record<string, React.CSSProperties> = {
  wrapper: { background: '#f8fafc', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  kpiRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  body: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  radarBox: { background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  constructRank: { background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' },
  sectionTitle: { fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', alignSelf: 'flex-start', width: '100%' },
  rankRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  completionBox: { marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' },
};

export default ClassStatsPanel;
