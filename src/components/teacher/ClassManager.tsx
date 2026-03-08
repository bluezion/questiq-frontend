// src/components/teacher/ClassManager.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 클래스(학급) 관리 패널 (v2)
// - 클래스 목록 / 생성 / 수정 / 삭제
// - 공유 코드 표시, 복사, 재발급
// - 링크 ON/OFF + 세부 링크 설정 (사전/사후 허용, 학번 요구 등)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import type { ClassRecord, LinkSettings } from '../../types/class';
import {
  apiListClasses, apiCreateClass, apiUpdateClass, apiDeleteClass,
  apiRegenShareCode, apiUpdateLinkSettings,
} from '../../services/classApiService';
import { tokenStore } from '../../services/studentApiService';

interface Props {
  onSelectClass: (cls: ClassRecord) => void;
  selectedClassId?: string;
}

// ── 모달 공통 프롭 ────────────────────────────────
interface ClassFormData {
  name: string;
  school?: string;
  grade?: string;
  subject?: string;
  year?: number;
  description?: string;
}
interface ModalProps {
  initial?: Partial<ClassRecord>;
  onSave: (data: { name: string; school?: string; grade?: string; subject?: string; year?: number; description?: string }) => Promise<void>;
  onClose: () => void;
}

function ClassFormModal({ initial, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState<ClassFormData>({
    name:        initial?.name        ?? '',
    school:      initial?.school      ?? '',
    grade:       initial?.grade       ?? '',
    subject:     initial?.subject     ?? '',
    year:        initial?.year        ?? new Date().getFullYear(),
    description: initial?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const set = (k: keyof ClassFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr('클래스 이름을 입력해주세요.'); return; }
    setSaving(true);
    try {
      await onSave({ ...form, name: form.name.trim() });
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={sty.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sty.modal}>
        <h3 style={sty.modalTitle}>{initial?.id ? '✏️ 클래스 수정' : '🏫 새 클래스 생성'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={sty.label}>
            클래스 이름 *
            <input style={sty.input} value={form.name} onChange={set('name')} placeholder="예: 중학교 2학년 A반" required autoFocus />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={sty.label}>
              학교
              <input style={sty.input} value={form.school ?? ''} onChange={set('school')} placeholder="예: 서울중학교" />
            </label>
            <label style={sty.label}>
              학년
              <input style={sty.input} value={form.grade ?? ''} onChange={set('grade')} placeholder="예: 중학교 2학년" />
            </label>
            <label style={sty.label}>
              과목
              <input style={sty.input} value={form.subject ?? ''} onChange={set('subject')} placeholder="예: 국어" />
            </label>
            <label style={sty.label}>
              연도
              <input style={{ ...sty.input, width: '100%' }} type="number" value={form.year ?? ''} onChange={set('year')} />
            </label>
          </div>
          <label style={sty.label}>
            설명 (선택)
            <textarea
              style={{ ...sty.input, height: 64, resize: 'vertical' }}
              value={form.description ?? ''}
              onChange={set('description')}
              placeholder="클래스 소개, 프로그램 목표 등"
            />
          </label>
          {err && <div style={sty.errText}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={sty.cancelBtn}>취소</button>
            <button type="submit" disabled={saving} style={sty.saveBtn}>
              {saving ? '저장 중...' : (initial?.id ? '수정 완료' : '클래스 생성')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 링크 설정 패널 ────────────────────────────────
interface LinkPanelProps {
  cls: ClassRecord;
  onUpdate: (updated: ClassRecord) => void;
  onClose: () => void;
}

function LinkSettingsPanel({ cls, onUpdate, onClose }: LinkPanelProps) {
  const [settings, setSettings] = useState<LinkSettings>({ ...cls.linkSettings });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}?share=${cls.shareCode}`;

  const toggle = (k: keyof LinkSettings) => () =>
    setSettings(prev => ({ ...prev, [k]: !prev[k] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiUpdateLinkSettings(cls.id, settings);
      onUpdate(updated);
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={sty.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...sty.modal, maxWidth: 480 }}>
        <h3 style={sty.modalTitle}>🔗 진단 링크 설정 — {cls.name}</h3>

        {/* 링크 URL 박스 */}
        <div style={lp.urlBox}>
          <code style={lp.urlText}>{shareUrl}</code>
          <button onClick={copyUrl} style={lp.copyBtn}>
            {copied ? '✅ 복사됨!' : '📋 복사'}
          </button>
        </div>

        {/* QR 코드 안내 */}
        <div style={lp.qrHint}>
          📱 QR 코드 생성: 위 링크를 <a href={`https://qr.io/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>qr.io</a>에 붙여넣으면 QR 코드를 즉시 생성할 수 있습니다.
        </div>

        {/* 공유 코드 */}
        <div style={lp.codeRow}>
          <span style={lp.codeLabel}>학생 입력 코드</span>
          <code style={lp.codeBadge}>{cls.shareCode}</code>
        </div>

        {/* 링크 설정 토글 목록 */}
        <div style={lp.toggleList}>
          {([
            { key: 'isOpen',           label: '링크 활성화',          desc: '비활성화 시 학생 접근 차단' },
            { key: 'allowPre',         label: '사전 진단 허용',         desc: '' },
            { key: 'allowPost',        label: '사후 진단 허용',         desc: '' },
            { key: 'requireStudentId', label: '학번 입력 필수',         desc: '학번을 입력해야 제출 가능' },
          ] as { key: keyof LinkSettings; label: string; desc: string }[]).map(({ key, label, desc }) => (
            <div key={key} style={lp.toggleRow}>
              <div>
                <div style={lp.toggleLabel}>{label}</div>
                {desc && <div style={lp.toggleDesc}>{desc}</div>}
              </div>
              <button
                onClick={toggle(key)}
                style={{
                  ...lp.toggleBtn,
                  background: settings[key] ? '#6366f1' : '#e2e8f0',
                  color:      settings[key] ? '#fff' : '#94a3b8',
                }}
              >
                {settings[key] ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onClose} style={sty.cancelBtn}>취소</button>
          <button onClick={handleSave} disabled={saving} style={sty.saveBtn}>
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────
export default function ClassManager({ onSelectClass, selectedClassId }: Props) {
  const [classes, setClasses]         = useState<ClassRecord[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState<ClassRecord | null>(null);
  const [linkTarget, setLinkTarget]   = useState<ClassRecord | null>(null);
  const [error, setError]             = useState('');
  const [regenLoading, setRegenLoading] = useState<string | null>(null);

  // ── 클래스 목록 로드 ──────────────────────────────
  const loadClasses = useCallback(async () => {
    if (!tokenStore.get()) return;
    setIsLoading(true);
    try {
      const list = await apiListClasses();
      setClasses(list);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  // ── 공유 코드 재발급 ──────────────────────────────
  const handleRegenCode = async (cls: ClassRecord) => {
    if (!window.confirm(`'${cls.name}'의 공유 코드를 재발급하면 기존 링크는 무효가 됩니다. 계속하시겠어요?`)) return;
    setRegenLoading(cls.id);
    try {
      const newCode = await apiRegenShareCode(cls.id);
      setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, shareCode: newCode } : c));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRegenLoading(null);
    }
  };

  // ── 링크 ON/OFF 토글 ──────────────────────────────
  const handleToggleLink = async (cls: ClassRecord) => {
    try {
      const updated = await apiUpdateLinkSettings(cls.id, { isOpen: !cls.linkSettings.isOpen });
      setClasses(prev => prev.map(c => c.id === cls.id ? updated : c));
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ── 삭제 ──────────────────────────────────────────
  const handleDelete = async (cls: ClassRecord) => {
    if (!window.confirm(`'${cls.name}'을(를) 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await apiDeleteClass(cls.id);
      setClasses(prev => prev.filter(c => c.id !== cls.id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ── 생성 ──────────────────────────────────────────
  const handleCreate = async (data: { name: string; school?: string; grade?: string; subject?: string; year?: number; description?: string }) => {
    const newCls = await apiCreateClass(data);
    setClasses(prev => [newCls, ...prev]);
    setShowCreate(false);
  };

  // ── 수정 ──────────────────────────────────────────
  const handleEdit = async (data: { name: string; school?: string; grade?: string; subject?: string; year?: number; description?: string }) => {
    if (!editTarget) return;
    const updated = await apiUpdateClass(editTarget.id, data);
    setClasses(prev => prev.map(c => c.id === editTarget.id ? updated : c));
    setEditTarget(null);
  };

  // ── 공유 URL 빠른 복사 ────────────────────────────
  const copyShareUrl = (shareCode: string) => {
    const url = `${window.location.origin}?share=${shareCode}`;
    navigator.clipboard.writeText(url).then(() => {
      // 작은 토스트 대신 console.log (URL은 링크 설정 패널에서 확인)
    });
    // 간단 피드백
    const btn = document.getElementById(`copy-btn-${shareCode}`);
    if (btn) { btn.textContent = '✅ 복사됨!'; setTimeout(() => { if (btn) btn.textContent = '🔗 링크 복사'; }, 2000); }
  };

  return (
    <div style={sty.root}>
      {/* 헤더 */}
      <div style={sty.header}>
        <h3 style={sty.title}>🏫 클래스 관리</h3>
        <button style={sty.createBtn} onClick={() => setShowCreate(true)}>+ 새 클래스</button>
      </div>

      {error && <div style={sty.errorBox}>⚠️ {error}</div>}
      {isLoading && <div style={sty.loadingText}>⏳ 불러오는 중...</div>}

      {!tokenStore.get() && (
        <div style={sty.loginHint}>
          🔑 교사 로그인 후 클래스를 생성하고 학생 진단 링크를 발급할 수 있습니다.
          <br />
          <span style={{ color: '#94a3b8', fontSize: 12 }}>로그인 전에는 데모 데이터로 대시보드를 탐색할 수 있습니다.</span>
        </div>
      )}

      {/* 클래스 목록 */}
      <div style={sty.list}>
        {classes.map(cls => (
          <div
            key={cls.id}
            style={{
              ...sty.classCard,
              ...(selectedClassId === cls.id ? sty.classCardActive : {}),
            }}
          >
            {/* 클릭 영역 → 선택 */}
            <div style={sty.classCardTop} onClick={() => onSelectClass(cls)}>
              <div style={{ flex: 1 }}>
                <div style={sty.classCardName}>{cls.name}</div>
                <div style={sty.classCardMeta}>
                  {[cls.school, cls.grade, cls.subject, cls.year ? `${cls.year}년` : ''].filter(Boolean).join(' · ')}
                </div>
                {/* 통계 */}
                <div style={sty.statsRow}>
                  <span style={sty.statBadge}>👥 {cls.statsCache?.totalStudents ?? 0}명</span>
                  <span style={sty.statBadge}>📋 사전 {cls.statsCache?.completedPre ?? 0}</span>
                  <span style={sty.statBadge}>📊 사후 {cls.statsCache?.completedPost ?? 0}</span>
                  {(cls.statsCache?.avgImprovement ?? 0) !== 0 && (
                    <span style={{ ...sty.statBadge, color: '#6366f1' }}>
                      ↑ 평균향상 +{cls.statsCache!.avgImprovement.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* 링크 상태 + 공유 코드 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{
                  ...sty.linkBadge,
                  background: cls.linkSettings.isOpen ? '#dcfce7' : '#fee2e2',
                  color:      cls.linkSettings.isOpen ? '#15803d' : '#dc2626',
                }}>
                  {cls.linkSettings.isOpen ? '● 링크 활성' : '○ 링크 비활성'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>코드:</span>
                  <code style={sty.shareCodeBadge}>{cls.shareCode}</code>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {cls.linkSettings.allowPre && <span style={sty.typePill}>📋 사전</span>}
                  {cls.linkSettings.allowPost && <span style={sty.typePill}>📊 사후</span>}
                  {cls.linkSettings.requireStudentId && <span style={sty.typePill}>🎫 학번필수</span>}
                </div>
              </div>
            </div>

            {/* 액션 버튼 행 */}
            <div style={sty.actionRow}>
              <button
                id={`copy-btn-${cls.shareCode}`}
                style={sty.actionBtn}
                onClick={() => copyShareUrl(cls.shareCode)}
              >
                🔗 링크 복사
              </button>
              <button style={{ ...sty.actionBtn, fontWeight: 700 }} onClick={() => setLinkTarget(cls)}>
                ⚙️ 링크 설정
              </button>
              <button style={sty.actionBtn} onClick={() => handleToggleLink(cls)}>
                {cls.linkSettings.isOpen ? '🔒 링크 닫기' : '🔓 링크 열기'}
              </button>
              <button
                style={sty.actionBtn}
                disabled={regenLoading === cls.id}
                onClick={() => handleRegenCode(cls)}
              >
                {regenLoading === cls.id ? '⏳' : '🔄'} 코드 재발급
              </button>
              <button style={sty.actionBtn} onClick={() => setEditTarget(cls)}>✏️ 수정</button>
              <button style={{ ...sty.actionBtn, color: '#ef4444' }} onClick={() => handleDelete(cls)}>🗑️ 삭제</button>
            </div>
          </div>
        ))}

        {classes.length === 0 && !isLoading && tokenStore.get() && (
          <div style={sty.emptyState}>
            <div style={{ fontSize: 48 }}>🏫</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#334155' }}>클래스가 없습니다</div>
            <div style={{ color: '#94a3b8', fontSize: 14 }}>
              '+ 새 클래스' 버튼으로 학급을 만들고<br />
              학생들에게 진단 링크를 공유해보세요!
            </div>
            <button style={sty.createBtn} onClick={() => setShowCreate(true)}>+ 첫 클래스 만들기</button>
          </div>
        )}
      </div>

      {/* 모달들 */}
      {showCreate  && <ClassFormModal onSave={handleCreate}           onClose={() => setShowCreate(false)} />}
      {editTarget  && <ClassFormModal initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />}
      {linkTarget  && <LinkSettingsPanel cls={linkTarget} onUpdate={u => { setClasses(prev => prev.map(c => c.id === u.id ? u : c)); setLinkTarget(u); }} onClose={() => setLinkTarget(null)} />}
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────
const sty: Record<string, React.CSSProperties> = {
  root:     { display: 'flex', flexDirection: 'column', gap: 14 },
  header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:    { margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' },
  createBtn:{ padding: '9px 18px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" },
  errorBox: { padding: '10px 14px', background: '#fee2e2', borderRadius: 10, color: '#dc2626', fontSize: 14 },
  loadingText:{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: 12 },
  loginHint:{ padding: '16px 20px', background: '#f0f4ff', borderRadius: 14, color: '#4338ca', fontSize: 14, lineHeight: 1.7, textAlign: 'center' },
  list:     { display: 'flex', flexDirection: 'column', gap: 12 },
  classCard:{ background: '#fff', borderRadius: 16, border: '2px solid #e2e8f0', overflow: 'hidden', transition: 'box-shadow 0.2s, border-color 0.2s' },
  classCardActive:{ borderColor: '#6366f1', boxShadow: '0 0 0 3px rgba(99,102,241,0.15)' },
  classCardTop:{ padding: '16px 18px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' },
  classCardName:{ fontSize: 16, fontWeight: 800, color: '#1e293b' },
  classCardMeta:{ fontSize: 12, color: '#64748b', marginTop: 3 },
  statsRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  statBadge:{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontWeight: 600 },
  linkBadge:{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  shareCodeBadge:{ fontSize: 13, fontWeight: 800, letterSpacing: 2, background: '#f0f4ff', color: '#4338ca', padding: '2px 10px', borderRadius: 6 },
  typePill: { background: '#f1f5f9', borderRadius: 6, padding: '2px 6px', marginRight: 3, fontSize: 11, color: '#475569' },
  actionRow:{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 14px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' },
  actionBtn:{ padding: '5px 12px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", color: '#475569' },
  emptyState:{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  // 모달 공통
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal:    { background: '#fff', borderRadius: 20, padding: '28px 28px', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle:{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' },
  label:    { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600, color: '#374151' },
  input:    { padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', fontFamily: "'Noto Sans KR', sans-serif" },
  errText:  { fontSize: 13, color: '#ef4444' },
  cancelBtn:{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", color: '#64748b' },
  saveBtn:  { padding: '9px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" },
};

// 링크 설정 패널 전용 스타일
const lp: Record<string, React.CSSProperties> = {
  urlBox:    { display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' },
  urlText:   { flex: 1, fontSize: 12, color: '#4338ca', wordBreak: 'break-all', fontWeight: 600 },
  copyBtn:   { padding: '6px 14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Noto Sans KR', sans-serif" },
  qrHint:    { fontSize: 12, color: '#64748b', background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', lineHeight: 1.6 },
  codeRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' },
  codeLabel: { fontSize: 13, fontWeight: 600, color: '#374151' },
  codeBadge: { fontSize: 18, fontWeight: 900, letterSpacing: 4, background: '#eef2ff', color: '#4338ca', padding: '4px 16px', borderRadius: 8 },
  toggleList:{ display: 'flex', flexDirection: 'column', gap: 8, border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 14 },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel:{ fontSize: 14, fontWeight: 600, color: '#1e293b' },
  toggleDesc:{ fontSize: 11, color: '#94a3b8' },
  toggleBtn: { padding: '5px 16px', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Noto Sans KR', sans-serif" },
};
