// src/components/teacher/AiCommentPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// AI 맞춤 피드백 패널 컴포넌트
// 학생 카드 하단에 접이식으로 표시, 생성/재생성/복사 기능 포함
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import type { StudentRecord } from '../../types/teacher';
import type { AiComment } from '../../types/teacher';
import { generateAiComment } from '../../services/aiCommentService';

interface AiCommentPanelProps {
  student: StudentRecord;
  onCommentGenerated: (comment: AiComment) => void;
}

const AiCommentPanel: React.FC<AiCommentPanelProps> = ({ student, onCommentGenerated }) => {
  const [isOpen, setIsOpen]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);

  const comment = student.aiComment;

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAiComment(student);
      onCommentGenerated(result);
      setIsOpen(true);
    } catch (e: any) {
      setError(e.message ?? 'AI 코멘트 생성 실패');
    } finally {
      setLoading(false);
    }
  }, [student, onCommentGenerated]);

  const handleCopy = useCallback(() => {
    if (!comment) return;
    const text = [
      `【${student.name} 학생 질문 역량 AI 피드백】`,
      `\n📝 종합 요약\n${comment.summary}`,
      `\n✅ 강점\n${comment.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      `\n💡 성장 영역\n${comment.improvements.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      `\n🚀 권장 활동\n${comment.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      `\n👩‍🏫 교사 팁\n${comment.teacherTips.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      `\n생성: ${new Date(comment.generatedAt).toLocaleString('ko-KR')} | 모델: ${comment.model}`,
    ].join('');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [comment, student.name]);

  return (
    <div style={styles.wrapper}>
      {/* 헤더 토글 */}
      <div style={styles.header} onClick={() => comment && setIsOpen(v => !v)}>
        <span style={styles.headerIcon}>🤖</span>
        <span style={styles.headerTitle}>AI 맞춤 피드백</span>
        {comment && (
          <span style={{ ...styles.badge, background: '#ede9fe', color: '#7c3aed' }}>
            {new Date(comment.generatedAt).toLocaleDateString('ko-KR')} 생성
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {comment && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              style={styles.iconBtn}
              title="클립보드 복사"
            >
              {copied ? '✅' : '📋'}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
            disabled={loading}
            style={{ ...styles.genBtn, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '⏳ 생성중...' : comment ? '🔄 재생성' : '✨ AI 피드백 생성'}
          </button>
          {comment && (
            <span style={{ color: '#94a3b8', fontSize: '16px' }}>
              {isOpen ? '▲' : '▼'}
            </span>
          )}
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div style={styles.errorBox}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} style={styles.closeBtn}>✕</button>
        </div>
      )}

      {/* 코멘트 본문 */}
      {comment && isOpen && (
        <div style={styles.body}>
          {/* 종합 요약 */}
          <div style={styles.summaryBox}>
            <div style={styles.summaryText}>{comment.summary}</div>
          </div>

          {/* 4섹션 그리드 */}
          <div style={styles.grid}>
            <CommentSection
              icon="✅" title="강점" items={comment.strengths}
              accent="#16a34a" bg="#f0fdf4"
            />
            <CommentSection
              icon="💡" title="성장 영역" items={comment.improvements}
              accent="#d97706" bg="#fffbeb"
            />
            <CommentSection
              icon="🚀" title="권장 활동" items={comment.nextSteps}
              accent="#6366f1" bg="#eef2ff"
            />
            <CommentSection
              icon="👩‍🏫" title="교사 팁" items={comment.teacherTips}
              accent="#8b5cf6" bg="#f5f3ff"
            />
          </div>

          {/* 메타 */}
          <div style={styles.meta}>
            🤖 {comment.model}
            {comment.tokensUsed && ` · ${comment.tokensUsed} tokens`}
            {' · '}{new Date(comment.generatedAt).toLocaleTimeString('ko-KR')}
          </div>
        </div>
      )}
    </div>
  );
};

// ── 섹션 서브 컴포넌트 ────────────────────────────────
const CommentSection: React.FC<{
  icon: string; title: string; items: string[];
  accent: string; bg: string;
}> = ({ icon, title, items, accent, bg }) => (
  <div style={{ background: bg, borderRadius: '10px', padding: '12px', border: `1.5px solid ${accent}22` }}>
    <div style={{ fontSize: '12px', fontWeight: 700, color: accent, marginBottom: '8px' }}>
      {icon} {title}
    </div>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '5px', fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>
        <span style={{ color: accent, flexShrink: 0 }}>•</span>
        <span>{item}</span>
      </div>
    ))}
  </div>
);

// ── 스타일 ────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: { borderTop: '1px solid #f1f5f9', marginTop: '8px' },
  header: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 0 8px', cursor: 'pointer',
    userSelect: 'none',
  },
  headerIcon: { fontSize: '16px' },
  headerTitle: { fontSize: '13px', fontWeight: 700, color: '#374151' },
  badge: { fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '15px', padding: '2px 6px', borderRadius: '6px',
  },
  genBtn: {
    padding: '5px 12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    border: 'none', borderRadius: '8px', color: '#fff',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  errorBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 12px', background: '#fef2f2', borderRadius: '8px',
    color: '#dc2626', fontSize: '12px', marginBottom: '8px',
  },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '14px' },
  body: { paddingBottom: '12px' },
  summaryBox: {
    background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)',
    borderRadius: '10px', padding: '12px 14px', marginBottom: '10px',
    border: '1.5px solid #c7d2fe',
  },
  summaryText: { fontSize: '13px', color: '#1e293b', lineHeight: 1.7, fontStyle: 'italic' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' },
  meta: { fontSize: '11px', color: '#94a3b8', textAlign: 'right' },
};

export default AiCommentPanel;
