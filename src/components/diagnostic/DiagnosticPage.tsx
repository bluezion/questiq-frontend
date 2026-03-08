// src/components/diagnostic/DiagnosticPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 사전-사후 진단 비교 메인 페이지 컴포넌트 (완전 통합)
//
// 렌더링 분기:
//  A. 사전+사후 완료 → 레이더 차트 + 비교 대시보드 전체 표시
//  B. 사전만 완료  → 사전 결과 + 사후 진단 시작 유도
//  C. 둘 다 없음   → 사전 진단 시작 유도 화면
//  D. 폼 활성화    → DiagnosticForm 렌더링
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { useDiagnostic } from '../../hooks/useDiagnostic';
import RadarChart from './RadarChart';
import DiagnosticForm from './DiagnosticForm';
import ConstructScoreBar from './ConstructScoreBar';
import GrowthSummaryCard from './GrowthSummaryCard';
import { CONSTRUCTS, getLevelInfo } from '../../data/diagnosticData';
import type { RadarDataPoint, DiagnosticComparison, ConstructComparison } from '../../types/diagnostic';

const DiagnosticPage: React.FC = () => {
  const {
    preResult, postResult, comparison,
    preAnswers, postAnswers,
    setPreAnswer, setPostAnswer,
    preProgress, postProgress,
    submitPre, submitPost,
    resetAll, resetPost,
    activeForm, setActiveForm,
  } = useDiagnostic();

  const [activeTab, setActiveTab] = useState<'radar' | 'bars' | 'detail'>('radar');

  // ── 레이더 차트 데이터 변환 ────────────────────────
  const radarData: RadarDataPoint[] = useMemo(() => {
    return CONSTRUCTS.map((c) => {
      const preScore = preResult?.constructScores
        .find((s) => s.constructId === c.id)?.normalizedScore ?? 0;
      const postScore = postResult?.constructScores
        .find((s) => s.constructId === c.id)?.normalizedScore ?? 0;
      return {
        constructId: c.id,
        label: c.label,
        labelShort: c.labelShort,
        emoji: c.emoji,
        color: c.color,
        lightColor: c.lightColor,
        preScore,
        postScore,
      };
    });
  }, [preResult, postResult]);

  // ════════════════════════════════════════════════════
  //  A. 설문 폼 활성화 상태
  // ════════════════════════════════════════════════════
  if (activeForm === 'pre') {
    return (
      <DiagnosticForm
        type="pre"
        answers={preAnswers}
        onAnswer={setPreAnswer}
        onSubmit={submitPre}
        onCancel={() => setActiveForm(null)}
        progress={preProgress}
      />
    );
  }

  if (activeForm === 'post') {
    return (
      <DiagnosticForm
        type="post"
        answers={postAnswers}
        onAnswer={setPostAnswer}
        onSubmit={submitPost}
        onCancel={() => setActiveForm(null)}
        progress={postProgress}
      />
    );
  }

  // ════════════════════════════════════════════════════
  //  B. 초기 화면 (사전 진단 미완료)
  // ════════════════════════════════════════════════════
  if (!preResult) {
    return <WelcomeScreen onStart={() => setActiveForm('pre')} />;
  }

  // ════════════════════════════════════════════════════
  //  C. 사전만 완료 → 사후 진단 유도
  // ════════════════════════════════════════════════════
  if (preResult && !postResult) {
    const preLevelInfo = getLevelInfo(preResult.totalAverage);
    return (
      <div style={pageStyles.wrapper}>
        <div style={pageStyles.container}>
          {/* 사전 결과 요약 */}
          <div style={pageStyles.preOnlyCard}>
            <div style={{
              background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
              borderRadius: '16px 16px 0 0',
              padding: '20px 24px',
            }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase' }}>
                📋 사전 진단 완료
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                {preLevelInfo.emoji} {preLevelInfo.label}
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                전체 평균 {preResult.totalAverage.toFixed(2)}점 / 5점
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <RadarChart
                dataPoints={radarData}
                size={340}
                showOnlyPre={true}
                preLabel="사전 진단"
                showLegend={true}
              />
            </div>

            {/* 구인별 점수 요약 */}
            <div style={{ padding: '0 20px 20px' }}>
              <div style={pageStyles.sectionTitle}>구인별 사전 점수</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {preResult.constructScores.map((cs) => {
                  const meta = CONSTRUCTS.find((c) => c.id === cs.constructId)!;
                  return (
                    <div key={cs.constructId} style={{
                      padding: '12px',
                      background: meta.lightColor,
                      borderRadius: '10px',
                      border: `1.5px solid ${meta.color}33`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span>{meta.emoji}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: meta.color }}>{meta.label}</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${cs.normalizedScore}%`, height: '100%', background: meta.color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: meta.color, marginTop: '4px', textAlign: 'right' }}>
                        {cs.averageScore.toFixed(2)} / 5.00
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 사후 진단 CTA */}
            <div style={{ padding: '0 20px 20px' }}>
              <div style={pageStyles.ctaBox}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  🚀 프로그램 이수 후 사후 진단을 받아보세요!
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  QFT 활동, 블룸 사다리 연습, 질문 일기를 마쳤다면 사후 진단으로 성장을 확인하세요.
                </div>
                <button
                  onClick={() => setActiveForm('post')}
                  style={pageStyles.postStartBtn}
                >
                  📊 사후 진단 시작하기
                </button>
              </div>
            </div>

            <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
              <button onClick={resetAll} style={pageStyles.resetBtn}>
                🔄 처음부터 다시
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  //  D. 사전+사후 모두 완료 → 전체 비교 대시보드
  // ════════════════════════════════════════════════════
  if (!comparison) return null;

  return (
    <div style={pageStyles.wrapper}>
      <div style={pageStyles.container}>

        {/* ── 성장 요약 히어로 카드 ─────────────────── */}
        <GrowthSummaryCard comparison={comparison} />

        {/* ── 탭 네비 ───────────────────────────────── */}
        <div style={pageStyles.tabBar}>
          {[
            { id: 'radar', icon: '🕸', label: '레이더 차트' },
            { id: 'bars',  icon: '📊', label: '구인 비교' },
            { id: 'detail',icon: '📋', label: '상세 분석' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                ...pageStyles.tabBtn,
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#64748b',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── 탭 1: 레이더 차트 ─────────────────────── */}
        {activeTab === 'radar' && (
          <div style={pageStyles.card}>
            <div style={pageStyles.cardHeader}>
              <div style={pageStyles.cardTitle}>🕸 사전-사후 레이더 차트</div>
              <div style={pageStyles.cardSub}>
                6개 질문 역량 구인의 사전(파랑)과 사후(보라) 비교
              </div>
            </div>

            {/* 레이더 차트 메인 */}
            <div style={{ padding: '24px 20px' }}>
              <RadarChart
                dataPoints={radarData}
                size={420}
                preLabel="사전 진단"
                postLabel="사후 진단"
                animateOnMount={true}
                showTooltip={true}
                showLegend={true}
              />
            </div>

            {/* 구인별 미니 통계 그리드 */}
            <div style={{ padding: '0 20px 24px' }}>
              <div style={pageStyles.sectionTitle}>구인별 변화 요약</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {comparison.constructComparisons.map((comp) => {
                  const meta = CONSTRUCTS.find(c => c.id === comp.constructId)!;
                  const improved = comp.improvement > 0;
                  return (
                    <div key={comp.constructId} style={{
                      padding: '12px',
                      background: improved ? meta.lightColor : '#f8fafc',
                      borderRadius: '12px',
                      border: `1.5px solid ${improved ? meta.color + '44' : '#e2e8f0'}`,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '20px' }}>{meta.emoji}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginTop: '4px' }}>
                        {meta.labelShort}
                      </div>
                      <div style={{
                        fontSize: '16px', fontWeight: 800, marginTop: '4px',
                        color: improved ? meta.color : '#ef4444',
                      }}>
                        {comp.improvement >= 0 ? '+' : ''}{comp.improvement.toFixed(2)}
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: 600, marginTop: '2px',
                        color: comp.isSignificant && improved ? '#16a34a' : '#94a3b8',
                      }}>
                        {comp.isSignificant && improved ? '✓ 유의미' : ''}
                        {!improved && '감소'}
                        {improved && !comp.isSignificant && '소폭 향상'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── 탭 2: 구인 비교 바 차트 ──────────────── */}
        {activeTab === 'bars' && (
          <div style={pageStyles.card}>
            <div style={pageStyles.cardHeader}>
              <div style={pageStyles.cardTitle}>📊 구인별 사전-사후 점수 비교</div>
              <div style={pageStyles.cardSub}>
                각 역량 영역의 점수 변화를 가로 바 차트로 확인하세요
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <ConstructScoreBar comparisons={comparison.constructComparisons} />
            </div>

            {/* 향상도 기준 안내 */}
            <div style={{ margin: '0 20px 20px', padding: '14px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={pageStyles.sectionTitle}>📏 유의미한 향상 기준 안내</div>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                <strong>0.5점 이상 향상</strong>이면 교육적으로 유의미한 성장으로 판단합니다.
                (출처: KCI 논문 "학생 질문 능력의 자기진단 평가도구 개발 및 타당화", ART003161879)
              </p>
            </div>
          </div>
        )}

        {/* ── 탭 3: 상세 분석 ───────────────────────── */}
        {activeTab === 'detail' && (
          <div style={pageStyles.card}>
            <div style={pageStyles.cardHeader}>
              <div style={pageStyles.cardTitle}>📋 상세 분석 보고서</div>
              <div style={pageStyles.cardSub}>
                문항별 응답 패턴과 역량 수준 진단
              </div>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 사전/사후 요약 비교표 */}
              <DetailTable comparison={comparison} />

              {/* 성장 단계 진행도 */}
              <GrowthMilestones comparison={comparison} />
            </div>
          </div>
        )}

        {/* ── 하단 액션 버튼 ────────────────────────── */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={resetPost} style={pageStyles.resetBtn}>
            🔄 사후 진단 다시하기
          </button>
          <button onClick={resetAll} style={pageStyles.resetBtn}>
            🗑 전체 초기화
          </button>
        </div>

      </div>
    </div>
  );
};

// ── 상세 비교표 서브 컴포넌트 ─────────────────────────
const DetailTable: React.FC<{ comparison: DiagnosticComparison }> = ({ comparison }) => (
  <div>
    <div style={pageStyles.sectionTitle}>비교 요약표</div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['구인', '사전 점수', '사후 점수', '향상도', '향상률', '유의미'].map((h) => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.constructComparisons.map((comp: ConstructComparison, i: number) => {
            const meta = CONSTRUCTS.find(c => c.id === comp.constructId)!;
            const imp = comp.improvement;
            return (
              <tr key={comp.constructId} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{meta.emoji}</span>
                  <span style={{ fontWeight: 600, color: meta.color }}>{meta.label}</span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#3b82f6', fontWeight: 700 }}>
                  {comp.preScore.toFixed(2)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#7c3aed', fontWeight: 700 }}>
                  {comp.postScore.toFixed(2)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: imp >= 0 ? '#16a34a' : '#ef4444' }}>
                  {imp >= 0 ? '+' : ''}{imp.toFixed(2)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                  {comp.improvementPct >= 0 ? '+' : ''}{comp.improvementPct}%
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {comp.isSignificant && imp > 0 ? (
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ 유의미</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
          {/* 합계 행 */}
          <tr style={{ background: '#ede9fe', fontWeight: 800 }}>
            <td style={{ padding: '10px 12px' }}>🎯 전체 평균</td>
            <td style={{ padding: '10px 12px', textAlign: 'center', color: '#3b82f6' }}>
              {comparison.pre.totalAverage.toFixed(2)}
            </td>
            <td style={{ padding: '10px 12px', textAlign: 'center', color: '#7c3aed' }}>
              {comparison.post.totalAverage.toFixed(2)}
            </td>
            <td style={{ padding: '10px 12px', textAlign: 'center', color: comparison.totalImprovement >= 0 ? '#16a34a' : '#ef4444' }}>
              {comparison.totalImprovement >= 0 ? '+' : ''}{comparison.totalImprovement.toFixed(2)}
            </td>
            <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
              {comparison.totalImprovementPct >= 0 ? '+' : ''}{comparison.totalImprovementPct}%
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// ── 성장 마일스톤 서브 컴포넌트 ───────────────────────
const GrowthMilestones: React.FC<{ comparison: DiagnosticComparison }> = ({ comparison }) => {
  const milestones = [
    { label: '씨앗 단계', emoji: '🌱', threshold: 0 },
    { label: '새싹 단계', emoji: '🌿', threshold: 1.8 },
    { label: '성장 단계', emoji: '🌸', threshold: 2.6 },
    { label: '개화 단계', emoji: '🌺', threshold: 3.4 },
    { label: '열매 단계', emoji: '🍎', threshold: 4.2 },
  ];
  const preAvg = comparison.pre.totalAverage;
  const postAvg = comparison.post.totalAverage;
  const maxVal = 5;

  return (
    <div>
      <div style={pageStyles.sectionTitle}>🌱 성장 단계 시각화</div>
      <div style={{ position: 'relative', padding: '20px 0' }}>
        {/* 트랙 */}
        <div style={{ height: '8px', background: 'linear-gradient(90deg,#94a3b8,#86efac,#6ee7b7,#fcd34d,#a78bfa)', borderRadius: '4px', margin: '0 16px' }} />

        {/* 마일스톤 마커 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: '-20px' }}>
          {milestones.map((m) => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '20px' }}>{m.emoji}</span>
              <div style={{ width: '3px', height: '16px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* 사전/사후 위치 마커 */}
        <div style={{ position: 'relative', height: '24px', margin: '8px 16px 0' }}>
          {[
            { avg: preAvg, color: '#3b82f6', label: '사전' },
            { avg: postAvg, color: '#8b5cf6', label: '사후' },
          ].map(({ avg, color, label }) => (
            <div
              key={label}
              style={{
                position: 'absolute',
                left: `${((avg - 1) / (maxVal - 1)) * 100}%`,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{
                padding: '3px 8px', background: color,
                color: '#fff', borderRadius: '8px',
                fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
              }}>
                {label} {avg.toFixed(2)}
              </div>
              <div style={{ width: '2px', height: '10px', background: color }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── 환영 화면 ─────────────────────────────────────────
const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
    <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '52px', marginBottom: '12px' }}>🎯</div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
        질문 역량 진단 시스템
      </h2>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.7 }}>
        KCI 논문 기반 6구인 25문항 자기진단 도구로<br />
        나의 질문 역량을 정확하게 측정하세요.
      </p>
    </div>

    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 6구인 소개 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {CONSTRUCTS.map((c) => (
          <div key={c.id} style={{
            padding: '12px', background: c.lightColor,
            borderRadius: '12px', border: `1.5px solid ${c.color}33`,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>{c.emoji}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: c.color }}>{c.label}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {c.description.slice(0, 16)}…
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', fontSize: '13px', color: '#64748b', lineHeight: 1.7 }}>
        📚 <strong>출처:</strong> "학생 질문 능력의 자기진단 평가도구 개발 및 타당화" (KCI, ART003161879)
        — 6구인 25문항, 표본 11,164명 검증
      </div>

      <button onClick={onStart} style={{
        padding: '14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        border: 'none', borderRadius: '12px', color: '#fff',
        fontSize: '16px', fontWeight: 700, cursor: 'pointer',
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        📋 사전 진단 시작하기 →
      </button>
    </div>
  </div>
);

// ── 공통 스타일 ─────────────────────────────────────────
const pageStyles: Record<string, React.CSSProperties> = {
  wrapper: { padding: '0' },
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { padding: '20px 20px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' },
  cardTitle: { fontSize: '16px', fontWeight: 800, color: '#1e293b' },
  cardSub: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  sectionTitle: { fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' },
  tabBar: { display: 'flex', gap: '6px', padding: '4px', background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tabBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Noto Sans KR', sans-serif" },
  preOnlyCard: { background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  ctaBox: { background: '#faf5ff', borderRadius: '14px', padding: '20px', border: '2px solid #e9d5ff' },
  postStartBtn: { width: '100%', padding: '13px', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" },
  resetBtn: { padding: '8px 16px', background: 'transparent', border: '1.5px solid #e2e8f0', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif" },
};

export default DiagnosticPage;
