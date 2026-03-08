// src/components/teacher/StudentMiniCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 학생 미니 카드 - 그리드 뷰용 (레이더 차트 미니 + 점수)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useRef } from 'react';
import type { StudentRecord } from '../../types/teacher';
import type { AiComment } from '../../types/teacher';
import type { RadarDataPoint } from '../../types/diagnostic';
import { CONSTRUCTS, getGrowthInfo, getLevelInfo } from '../../data/diagnosticData';
import RadarChart from '../diagnostic/RadarChart';
import AiCommentPanel from './AiCommentPanel';
import { generateStudentPdfReport } from '../../services/pdfReportService';

interface StudentMiniCardProps {
  student: StudentRecord;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onCommentGenerated: (studentId: string, comment: AiComment) => void;
}

const StudentMiniCard: React.FC<StudentMiniCardProps> = ({
  student, isSelected, onSelect, onCommentGenerated,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const radarData: RadarDataPoint[] = useMemo(() => {
    return CONSTRUCTS.map(c => ({
      constructId: c.id,
      label: c.label,
      labelShort: c.labelShort,
      emoji: c.emoji,
      color: c.color,
      lightColor: c.lightColor,
      preScore: student.pre?.constructScores.find(s => s.constructId === c.id)?.normalizedScore ?? 0,
      postScore: student.post?.constructScores.find(s => s.constructId === c.id)?.normalizedScore ?? 0,
    }));
  }, [student]);

  const hasBoth = !!student.comparison;
  const growthInfo = hasBoth ? getGrowthInfo(student.comparison!.totalImprovement) : null;
  const postLevel  = student.post ? getLevelInfo(student.post.totalAverage) : null;

  const handlePdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // SVG 요소 찾기 (카드 내부 SVG)
    const cardEl = document.getElementById(`student-card-${student.id}`);
    const svgEl  = cardEl?.querySelector('svg') as SVGSVGElement | null;
    await generateStudentPdfReport(student, student.aiComment, svgEl);
  };

  return (
    <div
      id={`student-card-${student.id}`}
      style={{
        ...cardStyles.card,
        border: isSelected ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
        boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onClick={() => onSelect(student.id)}
    >
      {/* ── 카드 헤더 ──────────────────────────────── */}
      <div style={cardStyles.header}>
        <div style={cardStyles.avatar}>
          {student.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={cardStyles.name}>{student.name}</div>
          <div style={cardStyles.grade}>{student.grade} {student.group && `· ${student.group}`}</div>
        </div>
        {growthInfo && (
          <div style={{ ...cardStyles.growthBadge, background: growthInfo.color + '22', color: growthInfo.color }}>
            {growthInfo.emoji} {growthInfo.label}
          </div>
        )}
      </div>

      {/* ── 레이더 차트 (미니) ─────────────────────── */}
      <div style={{ padding: '0 4px' }}>
        <RadarChart
          dataPoints={radarData}
          size={240}
          showLegend={false}
          showTooltip={true}
          animateOnMount={false}
          showOnlyPre={!hasBoth}
          preLabel="사전"
          postLabel="사후"
        />
      </div>

      {/* ── 점수 요약 ────────────────────────────────── */}
      <div style={cardStyles.scoreRow}>
        <ScoreChip
          label="사전"
          value={student.pre ? student.pre.totalAverage.toFixed(2) : '—'}
          color="#3b82f6"
        />
        {hasBoth && (
          <>
            <ScoreChip
              label="사후"
              value={student.post!.totalAverage.toFixed(2)}
              color="#8b5cf6"
            />
            <ScoreChip
              label="향상"
              value={`+${student.comparison!.totalImprovement.toFixed(2)}`}
              color={student.comparison!.totalImprovement >= 0 ? '#16a34a' : '#ef4444'}
            />
          </>
        )}
      </div>

      {/* ── 단계 레벨 ───────────────────────────────── */}
      {postLevel && (
        <div style={cardStyles.levelRow}>
          <span>{postLevel.emoji}</span>
          <span style={{ fontSize: '12px', color: postLevel.color, fontWeight: 700 }}>
            {postLevel.label}
          </span>
        </div>
      )}

      {/* ── 구인별 탑3 향상 ──────────────────────────── */}
      {hasBoth && (
        <div style={cardStyles.constructMini}>
          {student.comparison!.constructComparisons
            .filter(cc => cc.improvement > 0)
            .sort((a, b) => b.improvement - a.improvement)
            .slice(0, 3)
            .map(cc => {
              const meta = CONSTRUCTS.find(c => c.id === cc.constructId)!;
              return (
                <div
                  key={cc.constructId}
                  style={{ ...cardStyles.constructTag, background: meta.lightColor, color: meta.color }}
                >
                  {meta.emoji} +{cc.improvement.toFixed(1)}
                </div>
              );
            })}
        </div>
      )}

      {/* ── 액션 버튼 ───────────────────────────────── */}
      <div style={cardStyles.actions} onClick={e => e.stopPropagation()}>
        <button
          onClick={handlePdf}
          style={cardStyles.actionBtn}
          title="PDF 리포트 다운로드"
        >
          📄 PDF
        </button>
      </div>

      {/* ── AI 코멘트 패널 ───────────────────────────── */}
      {hasBoth && (
        <div onClick={e => e.stopPropagation()}>
          <AiCommentPanel
            student={student}
            onCommentGenerated={(comment) => onCommentGenerated(student.id, comment)}
          />
        </div>
      )}
    </div>
  );
};

// ── 점수 칩 ──────────────────────────────────────────
const ScoreChip: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: '16px', fontWeight: 800, color }}>{value}</div>
  </div>
);

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff', borderRadius: '16px', padding: '14px',
    cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  header: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: '16px', flexShrink: 0,
  },
  name: { fontSize: '15px', fontWeight: 700, color: '#1e293b' },
  grade: { fontSize: '12px', color: '#94a3b8' },
  growthBadge: {
    fontSize: '11px', fontWeight: 700, padding: '3px 8px',
    borderRadius: '8px', whiteSpace: 'nowrap',
  },
  scoreRow: { display: 'flex', justifyContent: 'space-around' },
  levelRow: { display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' },
  constructMini: { display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' },
  constructTag: { fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' },
  actions: { display: 'flex', gap: '6px', justifyContent: 'flex-end' },
  actionBtn: {
    padding: '5px 10px', background: '#f8fafc',
    border: '1.5px solid #e2e8f0', borderRadius: '8px',
    fontSize: '12px', cursor: 'pointer', color: '#475569', fontWeight: 600,
    fontFamily: "'Noto Sans KR', sans-serif",
  },
};

export default StudentMiniCard;
