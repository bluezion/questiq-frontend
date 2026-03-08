// src/components/teacher/TeacherDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 교사 대시보드 메인 컴포넌트
// 탭: 클래스 통계 | 학생 그리드 | 학생 테이블
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useMemo } from 'react';
import { useTeacherDashboard } from '../../hooks/useTeacherDashboard';
import ClassStatsPanel from './ClassStatsPanel';
import StudentMiniCard from './StudentMiniCard';
import ClassManager from './ClassManager';
import SubmissionInbox from './SubmissionInbox';
import type { AiComment } from '../../types/teacher';
import type { ClassRecord } from '../../types/class';
import type { SortField, SortDir } from '../../types/teacher';
import { tokenStore } from '../../services/studentApiService';
import { CONSTRUCTS, getGrowthInfo, getLevelInfo } from '../../data/diagnosticData';
import { generateClassPdfReport } from '../../services/pdfReportService';

type DashTab = 'classes' | 'stats' | 'grid' | 'table' | 'inbox';

const TeacherDashboard: React.FC = () => {
  const {
    students, classStats, setAiComment, resetToDemo,
    refresh, setActiveClassId, isSynced, syncError,
  } = useTeacherDashboard();

  const [activeTab, setActiveTab]         = useState<DashTab>('classes');
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());

  // selectedClass 변경 시 해당 클래스 학생 로드
  React.useEffect(() => {
    setActiveClassId(selectedClass?.id ?? null);
    refresh(selectedClass?.id ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass?.id]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterGroup, setFilterGroup]     = useState<string>('all');
  const [sortField, setSortField]         = useState<SortField>('improvement');
  const [sortDir, setSortDir]             = useState<SortDir>('desc');
  const [pdfLoading, setPdfLoading]       = useState(false);

  // 그룹 목록 추출
  const groups = useMemo(() => {
    const g = Array.from(new Set(students.map(s => s.group).filter(Boolean))) as string[];
    return ['all', ...g];
  }, [students]);

  // 필터 + 정렬
  const filteredStudents = useMemo(() => {
    let list = [...students];

    // 검색
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q) ||
        (s.group ?? '').toLowerCase().includes(q)
      );
    }
    // 그룹 필터
    if (filterGroup !== 'all') {
      list = list.filter(s => s.group === filterGroup);
    }
    // 정렬
    list.sort((a, b) => {
      let va = 0, vb = 0;
      if (sortField === 'name') {
        return sortDir === 'asc'
          ? a.name.localeCompare(b.name, 'ko')
          : b.name.localeCompare(a.name, 'ko');
      }
      if (sortField === 'improvement') {
        va = a.comparison?.totalImprovement ?? -99;
        vb = b.comparison?.totalImprovement ?? -99;
      } else if (sortField === 'postScore') {
        va = a.post?.totalAverage ?? 0;
        vb = b.post?.totalAverage ?? 0;
      } else if (sortField === 'addedAt') {
        va = new Date(a.addedAt).getTime();
        vb = new Date(b.addedAt).getTime();
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });

    return list;
  }, [students, searchQuery, filterGroup, sortField, sortDir]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleCommentGenerated = useCallback((studentId: string, comment: AiComment) => {
    setAiComment(studentId, comment);
  }, [setAiComment]);

  const handleClassPdf = async () => {
    setPdfLoading(true);
    try { await generateClassPdfReport(students); }
    finally { setPdfLoading(false); }
  };

  // ── 탭 버튼 ──────────────────────────────────────
  const tabs: { id: DashTab; icon: string; label: string }[] = [
    { id: 'classes', icon: '🏫', label: '클래스 관리' },
    ...(selectedClass ? [
      { id: 'stats'  as DashTab, icon: '📊', label: '클래스 통계' },
      { id: 'grid'   as DashTab, icon: '🃏', label: `학생 카드 (${filteredStudents.length})` },
      { id: 'table'  as DashTab, icon: '📋', label: '학생 테이블' },
      ...(tokenStore.get() ? [{ id: 'inbox' as DashTab, icon: '📬', label: '제출 수신함' }] : []),
    ] : []),
  ];

  return (
    <div style={ds.root}>
      {/* ── 대시보드 헤더 ─────────────────────────── */}
      <div style={ds.dashHeader}>
        <div>
          <div style={ds.dashTitle}>👩‍🏫 교사 대시보드</div>
          <div style={ds.dashSub}>
            {selectedClass ? `${selectedClass.name} · 학생 ${classStats.totalStudents}명` : `전체 학생 ${classStats.totalStudents}명`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleClassPdf} disabled={pdfLoading} style={ds.pdfBtn}>
            {pdfLoading ? '⏳ 생성중...' : '📥 클래스 전체 PDF'}
          </button>
          {syncError && (
            <div style={{ color: '#fca5a5', fontSize: '12px', alignSelf: 'flex-end' }}>
              ⚠️ {syncError}
            </div>
          )}
          {isSynced && (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', alignSelf: 'flex-end' }}>
              ✅ DB 연동됨
            </div>
          )}
          <button onClick={resetToDemo} style={ds.resetBtn}>
            🔄 데모 초기화
          </button>
        </div>
      </div>

      {/* ── 탭 바 ─────────────────────────────────── */}
      <div style={ds.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...ds.tabBtn,
              background: activeTab === tab.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ══ 탭 0: 클래스 관리 ══ */}
      {activeTab === 'classes' && (
        <ClassManager
          onSelectClass={(cls) => { setSelectedClass(cls); setActiveTab('stats'); }}
          selectedClassId={selectedClass?.id}
        />
      )}

      {/* ══ 탭 1: 클래스 통계 ══ */}
      {activeTab === 'stats' && (
        <ClassStatsPanel stats={classStats} students={students} />
      )}

      {/* ── 탭 2 / 3 공통 필터 바 ──────────────────── */}
      {(activeTab === 'grid' || activeTab === 'table') && (
        <div style={ds.filterBar}>
          {/* 검색 */}
          <div style={ds.searchBox}>
            <span style={{ fontSize: '14px' }}>🔍</span>
            <input
              type="text"
              placeholder="이름, 학년, 모둠 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={ds.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={ds.clearBtn}>✕</button>
            )}
          </div>

          {/* 모둠 필터 */}
          <select
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            style={ds.select}
          >
            {groups.map(g => (
              <option key={g} value={g}>{g === 'all' ? '전체 모둠' : g}</option>
            ))}
          </select>

          {/* 정렬 */}
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value as SortField)}
            style={ds.select}
          >
            <option value="improvement">향상도순</option>
            <option value="postScore">사후점수순</option>
            <option value="name">이름순</option>
            <option value="addedAt">등록순</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            style={ds.sortDirBtn}
            title={sortDir === 'desc' ? '내림차순' : '오름차순'}
          >
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      )}

      {/* ── 탭 2: 학생 그리드 ─────────────────────── */}
      {activeTab === 'grid' && (
        <div style={ds.grid}>
          {filteredStudents.map(student => (
            <StudentMiniCard
              key={student.id}
              student={student}
              isSelected={selectedIds.has(student.id)}
              onSelect={toggleSelect}
              onCommentGenerated={handleCommentGenerated}
            />
          ))}
          {filteredStudents.length === 0 && (
            <div style={ds.emptyState}>
              😕 검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}

      {/* ── 탭 3: 학생 테이블 ─────────────────────── */}
      {activeTab === 'table' && (
        <div style={ds.tableWrapper}>
          <table style={ds.table}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['이름', '학년', '모둠', '사전', '사후', '향상도', '향상률', '성장 등급', '최고 구인', 'AI 피드백', 'PDF'].map(h => (
                  <th key={h} style={ds.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, i) => {
                const hasBoth = !!s.comparison;
                const growthInfo = hasBoth ? getGrowthInfo(s.comparison!.totalImprovement) : null;
                const topMeta = hasBoth ? CONSTRUCTS.find(c => c.id === s.comparison!.mostImprovedConstruct) : null;
                const postLvl = s.post ? getLevelInfo(s.post.totalAverage) : null;
                const [pdfRow, setPdfRow] = [false, () => {}]; // row-level PDF state not used here

                return (
                  <tr
                    key={s.id}
                    style={{
                      background: i % 2 === 0 ? '#fff' : '#fafafa',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ede9fe')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa')}
                  >
                    <td style={ds.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={ds.miniAvatar}>{s.name[0]}</div>
                        <span style={{ fontWeight: 700 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={ds.td}>{s.grade}</td>
                    <td style={ds.td}>{s.group ?? '—'}</td>
                    <td style={{ ...ds.td, color: '#3b82f6', fontWeight: 700 }}>
                      {s.pre ? s.pre.totalAverage.toFixed(2) : '—'}
                    </td>
                    <td style={{ ...ds.td, color: '#8b5cf6', fontWeight: 700 }}>
                      {s.post ? s.post.totalAverage.toFixed(2) : '—'}
                    </td>
                    <td style={{ ...ds.td, fontWeight: 800, color: hasBoth ? (s.comparison!.totalImprovement >= 0 ? '#16a34a' : '#ef4444') : '#94a3b8' }}>
                      {hasBoth ? `${s.comparison!.totalImprovement >= 0 ? '+' : ''}${s.comparison!.totalImprovement.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ ...ds.td, color: '#64748b' }}>
                      {hasBoth ? `${s.comparison!.totalImprovementPct >= 0 ? '+' : ''}${s.comparison!.totalImprovementPct}%` : '—'}
                    </td>
                    <td style={ds.td}>
                      {growthInfo ? (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: growthInfo.color }}>
                          {growthInfo.emoji} {growthInfo.label}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={ds.td}>
                      {topMeta ? (
                        <span style={{ fontSize: '12px', color: topMeta.color, fontWeight: 600 }}>
                          {topMeta.emoji} {topMeta.label}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={ds.td}>
                      {s.aiComment ? (
                        <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600 }}>
                          ✅ {new Date(s.aiComment.generatedAt).toLocaleDateString('ko-KR')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>미생성</span>
                      )}
                    </td>
                    <td style={ds.td}>
                      <button
                        onClick={async () => {
                          const cardEl = document.getElementById(`student-card-${s.id}`);
                          const svgEl = cardEl?.querySelector('svg') as SVGSVGElement | null;
                          await generateStudentPdfReport(s, s.aiComment, svgEl);
                        }}
                        style={ds.pdfMiniBtn}
                      >
                        📄
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* ══ 탭 5: 제출 수신함 ══ */}
      {activeTab === 'inbox' && selectedClass && (
        <SubmissionInbox
          classId={selectedClass.id}
          className={selectedClass.name}
          onRefreshStudents={refresh}
        />
      )}

    </div>
  );
};

// generateStudentPdfReport import (테이블 내부에서 사용)
import { generateStudentPdfReport } from '../../services/pdfReportService';

const ds: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', gap: '14px' },
  dashHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: '12px',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    borderRadius: '18px', padding: '20px 24px', color: '#fff',
  },
  dashTitle: { fontSize: '20px', fontWeight: 800 },
  dashSub: { fontSize: '13px', opacity: 0.85, marginTop: '4px' },
  pdfBtn: {
    padding: '8px 16px', background: 'rgba(255,255,255,0.2)',
    border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '10px',
    color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  resetBtn: {
    padding: '8px 16px', background: 'transparent',
    border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '10px',
    color: 'rgba(255,255,255,0.8)', fontSize: '13px', cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  tabBar: {
    display: 'flex', gap: '6px', padding: '4px',
    background: '#fff', borderRadius: '14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  tabBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '6px', padding: '10px', borderRadius: '10px', border: 'none',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s', fontFamily: "'Noto Sans KR', sans-serif",
  },
  filterBar: {
    display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
    background: '#fff', padding: '12px 16px', borderRadius: '14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#f8fafc', border: '1.5px solid #e2e8f0',
    borderRadius: '10px', padding: '6px 12px', flex: 1, minWidth: '180px',
  },
  searchInput: {
    border: 'none', background: 'transparent', outline: 'none',
    fontSize: '13px', flex: 1, fontFamily: "'Noto Sans KR', sans-serif",
  },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', padding: '0' },
  select: {
    padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    background: '#f8fafc', fontSize: '13px', cursor: 'pointer',
    fontFamily: "'Noto Sans KR', sans-serif", color: '#475569',
  },
  sortDirBtn: {
    padding: '7px 12px', background: '#f8fafc',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '16px', cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px',
  },
  emptyState: {
    gridColumn: '1 / -1', textAlign: 'center', padding: '40px',
    color: '#94a3b8', fontSize: '15px',
  },
  tableWrapper: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { padding: '11px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  miniAvatar: {
    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: '12px',
  },
  pdfMiniBtn: {
    background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px',
    padding: '4px 8px', cursor: 'pointer', fontSize: '14px',
  },
};

export default TeacherDashboard;
