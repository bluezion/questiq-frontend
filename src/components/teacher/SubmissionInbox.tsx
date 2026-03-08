// src/components/teacher/SubmissionInbox.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 교사용 제출 수신함
// - 학생이 공유 링크로 제출한 진단 결과 목록
// - 개별/일괄 승인 → Student에 자동 병합
// - 거절 + 사유 입력
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import type { DiagnosticSubmission } from '../../types/class';
import {
  apiListSubmissions, apiApproveSubmission,
  apiBulkApprove, apiRejectSubmission,
} from '../../services/classApiService';
import { CONSTRUCTS } from '../../data/diagnosticData';

interface Props {
  classId: string;
  className: string;
  onRefreshStudents?: () => void;
}

type FilterStatus = 'pending' | 'merged' | 'rejected' | 'all';

export default function SubmissionInbox({ classId, className, onRefreshStudents }: Props) {
  const [items, setItems]           = useState<DiagnosticSubmission[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [filterStatus, setFilter]   = useState<FilterStatus>('pending');
  const [selectedIds, setSelected]  = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<DiagnosticSubmission | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [toast, setToast]           = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── 목록 로드 ─────────────────────────────────────
  const loadItems = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const { submissions, pagination: pg } = await apiListSubmissions(classId, {
        status: filterStatus === 'all' ? undefined : filterStatus,
        page, limit: 30,
      });
      setItems(submissions);
      setPagination(pg);
      setSelected(new Set());
    } catch (e: any) {
      showToast(`로드 실패: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [classId, filterStatus]);

  useEffect(() => { loadItems(1); }, [loadItems]);

  // ── 개별 승인 ─────────────────────────────────────
  const handleApprove = async (sub: DiagnosticSubmission) => {
    try {
      await apiApproveSubmission(classId, sub.id);
      setItems(prev => prev.filter(s => s.id !== sub.id));
      showToast(`✅ ${sub.studentName} 승인 완료`);
      onRefreshStudents?.();
    } catch (e: any) {
      showToast(`오류: ${e.message}`);
    }
  };

  // ── 일괄 승인 ─────────────────────────────────────
  const handleBulkApprove = async () => {
    if (!selectedIds.size) return;
    setBulkLoading(true);
    try {
      const { succeeded, failed } = await apiBulkApprove(classId, [...selectedIds]);
      showToast(`✅ ${succeeded}건 승인 완료${failed ? ` (${failed}건 실패)` : ''}`);
      await loadItems(1);
      onRefreshStudents?.();
    } catch (e: any) {
      showToast(`오류: ${e.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // ── 거절 ──────────────────────────────────────────
  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    try {
      await apiRejectSubmission(classId, rejectModal.id, rejectNote);
      setItems(prev => prev.map(s => s.id === rejectModal.id ? { ...s, status: 'rejected' } : s));
      showToast(`❌ ${rejectModal.studentName} 거절 처리`);
      setRejectModal(null); setRejectNote('');
    } catch (e: any) {
      showToast(`오류: ${e.message}`);
    }
  };

  // ── 전체 선택 ─────────────────────────────────────
  const pendingItems  = items.filter(s => s.status === 'pending');
  const isAllSelected = pendingItems.length > 0 && pendingItems.every(s => selectedIds.has(s.id));
  const toggleAll     = () => {
    if (isAllSelected) setSelected(new Set());
    else setSelected(new Set(pendingItems.map(s => s.id)));
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── 점수 요약 ─────────────────────────────────────
  const getScoreSummary = (sub: DiagnosticSubmission) => {
    const top = [...sub.constructScores].sort((a, b) => b.averageScore - a.averageScore)[0];
    const label = CONSTRUCTS.find(c => c.id === top?.constructId)?.labelShort ?? '';
    return { avg: sub.totalAverage?.toFixed(1) ?? '-', top: label };
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending:  { bg: '#fffbeb', text: '#d97706', label: '대기 중' },
    approved: { bg: '#f0fdf4', text: '#15803d', label: '승인됨' },
    merged:   { bg: '#eff6ff', text: '#1d4ed8', label: '적용됨' },
    rejected: { bg: '#fef2f2', text: '#dc2626', label: '거절됨' },
  };

  return (
    <div style={sty.root}>
      {/* 헤더 */}
      <div style={sty.header}>
        <div>
          <h3 style={sty.title}>📬 제출 수신함</h3>
          <p style={sty.subtitle}>{className} · 총 {pagination.total}건</p>
        </div>
        {selectedIds.size > 0 && (
          <button
            style={{ ...sty.bulkBtn, ...(bulkLoading ? { opacity: 0.6 } : {}) }}
            onClick={handleBulkApprove} disabled={bulkLoading}
          >
            {bulkLoading ? '처리 중...' : `✅ ${selectedIds.size}건 일괄 승인`}
          </button>
        )}
      </div>

      {/* 필터 탭 */}
      <div style={sty.filterRow}>
        {(['pending', 'merged', 'rejected', 'all'] as FilterStatus[]).map(s => (
          <button
            key={s}
            style={{ ...sty.filterBtn, ...(filterStatus === s ? sty.filterBtnActive : {}) }}
            onClick={() => setFilter(s)}
          >
            {{ pending: '⏳ 대기', merged: '✅ 적용', rejected: '❌ 거절', all: '📋 전체' }[s]}
          </button>
        ))}
      </div>

      {/* 전체 선택 */}
      {filterStatus === 'pending' && pendingItems.length > 0 && (
        <label style={sty.selectAllRow}>
          <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
          <span style={{ fontSize: 13, color: '#475569' }}>전체 선택</span>
        </label>
      )}

      {/* 로딩 */}
      {isLoading && <div style={sty.loadingText}>불러오는 중...</div>}

      {/* 목록 */}
      <div style={sty.list}>
        {items.map(sub => {
          const sc = statusColors[sub.status] || statusColors.pending;
          const { avg, top } = getScoreSummary(sub);
          return (
            <div key={sub.id} style={sty.card}>
              <div style={sty.cardTop}>
                {sub.status === 'pending' && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(sub.id)}
                    onChange={() => toggleOne(sub.id)}
                    style={{ marginRight: 10, accentColor: '#6366f1', width: 16, height: 16 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={sty.cardName}>{sub.studentName}
                    {sub.studentCode && <span style={sty.codeTag}>{sub.studentCode}</span>}
                  </div>
                  <div style={sty.cardMeta}>
                    {sub.grade && <span>{sub.grade} · </span>}
                    <span>{sub.diagnosticType === 'pre' ? '📋 사전 진단' : '📊 사후 진단'}</span>
                    <span style={{ marginLeft: 8 }}>평균 {avg}점</span>
                    {top && <span style={{ marginLeft: 6 }}>최고: {top}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                    {new Date(sub.submittedAt).toLocaleString('ko-KR')}
                  </div>
                </div>
                <span style={{ ...sty.statusBadge, background: sc.bg, color: sc.text }}>
                  {sc.label}
                </span>
              </div>

              {/* 액션 버튼 (대기 중만) */}
              {sub.status === 'pending' && (
                <div style={sty.cardActions}>
                  <button style={sty.approveBtn} onClick={() => handleApprove(sub)}>
                    ✅ 승인 + 학생 반영
                  </button>
                  <button style={sty.rejectBtn} onClick={() => setRejectModal(sub)}>
                    ❌ 거절
                  </button>
                </div>
              )}
              {sub.status === 'merged' && sub.studentId && (
                <div style={sty.mergedInfo}>🔗 학생 ID: {sub.studentId.slice(-6).toUpperCase()}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 빈 상태 */}
      {!isLoading && items.length === 0 && (
        <div style={sty.emptyState}>
          <div style={{ fontSize: 36 }}>📭</div>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>
            {filterStatus === 'pending' ? '대기 중인 제출이 없습니다.' : '제출 항목이 없습니다.'}
          </p>
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div style={sty.pageRow}>
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i}
              style={{ ...sty.pageBtn, ...(pagination.page === i+1 ? sty.pageBtnActive : {}) }}
              onClick={() => loadItems(i+1)}
            >
              {i+1}
            </button>
          ))}
        </div>
      )}

      {/* 거절 모달 */}
      {rejectModal && (
        <div style={sty.modalOverlay}>
          <div style={sty.modal}>
            <h3 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>거절 사유</h3>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 16 }}>
              <strong>{rejectModal.studentName}</strong>의 제출을 거절하시겠어요?
            </p>
            <textarea
              style={{ width: '100%', padding: 10, borderRadius: 10, border: '2px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', minHeight: 80, boxSizing: 'border-box' }}
              placeholder="거절 사유 (선택 사항)"
              value={rejectNote} onChange={e => setRejectNote(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={sty.cancelBtn} onClick={() => { setRejectModal(null); setRejectNote(''); }}>취소</button>
              <button style={sty.confirmRejectBtn} onClick={handleRejectConfirm}>거절 확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div style={sty.toast}>{toast}</div>
      )}
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────
const sty: Record<string, React.CSSProperties> = {
  root:          { display: 'flex', flexDirection: 'column', gap: 10 },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title:         { fontSize: 16, fontWeight: 800, color: '#1e293b' },
  subtitle:      { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  bulkBtn:       {
    padding: '10px 18px', background: 'linear-gradient(135deg,#059669,#10b981)',
    color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700,
    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  },
  filterRow:     { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn:     {
    padding: '7px 14px', borderRadius: 20, border: '1.5px solid #e5e7eb',
    background: '#f9fafb', color: '#64748b', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  filterBtnActive: { background: '#6366f1', color: '#fff', border: '1.5px solid transparent' },
  selectAllRow:  { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  loadingText:   { color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 16 },
  list:          { display: 'flex', flexDirection: 'column', gap: 8 },
  card:          { background: '#fff', borderRadius: 12, border: '1.5px solid #e5e7eb', overflow: 'hidden' },
  cardTop:       { display: 'flex', alignItems: 'center', padding: '12px 14px' },
  cardName:      { fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  codeTag:       { fontSize: 11, background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, color: '#64748b' },
  cardMeta:      { fontSize: 12, color: '#64748b', marginTop: 3 },
  statusBadge:   { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0, marginLeft: 8 },
  cardActions:   { display: 'flex', gap: 8, padding: '8px 14px', borderTop: '1px solid #f1f5f9' },
  approveBtn:    {
    flex: 1, padding: '8px 0', background: 'linear-gradient(135deg,#059669,#10b981)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  rejectBtn:     {
    padding: '8px 14px', background: '#fef2f2', border: '1px solid #fca5a5',
    color: '#dc2626', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  mergedInfo:    { padding: '6px 14px', fontSize: 12, color: '#1d4ed8', background: '#eff6ff' },
  emptyState:    { textAlign: 'center', padding: '32px 0' },
  pageRow:       { display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 },
  pageBtn:       { width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' },
  pageBtnActive: { background: '#6366f1', color: '#fff', border: '1.5px solid transparent' },
  modalOverlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal:         { background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420 },
  cancelBtn:     { flex: 1, padding: 10, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  confirmRejectBtn: { flex: 1, padding: 10, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  toast:         {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    background: '#1e293b', color: '#fff', padding: '12px 24px', borderRadius: 12,
    fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
  },
};
