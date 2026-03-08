// src/services/pdfReportService.ts
// ─────────────────────────────────────────────────────────────────────────────
// PDF 리포트 생성 서비스
// html2canvas + jsPDF 조합으로 레이더 차트 포함 A4 PDF 생성
// ─────────────────────────────────────────────────────────────────────────────
import type { StudentRecord } from '../types/teacher';
import type { AiComment } from '../types/teacher';
import { CONSTRUCTS, getGrowthInfo, getLevelInfo } from '../data/diagnosticData';

import type { jsPDF as JsPDFType } from 'jspdf';

// ── 동적 import (번들 분리) ───────────────────────────
async function loadLibs() {
  const [html2canvasModule, jsPDFModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  // jsPDF 모듈은 named export와 default 양쪽에서 접근 가능
  const JsPDF = (jsPDFModule as any).jsPDF as typeof JsPDFType;
  return {
    html2canvas: html2canvasModule.default,
    jsPDF: JsPDF,
  };
}

// ── 컬러 팔레트 ───────────────────────────────────────
const PDF_COLORS = {
  primary:    [99, 102, 241] as [number,number,number],   // indigo-500
  secondary:  [139, 92, 246] as [number,number,number],   // violet-500
  success:    [22, 163, 74]  as [number,number,number],   // green-600
  danger:     [239, 68, 68]  as [number,number,number],   // red-500
  muted:      [100, 116, 139] as [number,number,number],  // slate-500
  bg:         [248, 250, 252] as [number,number,number],  // slate-50
  white:      [255, 255, 255] as [number,number,number],
  text:       [30, 41, 59]   as [number,number,number],   // slate-800
  border:     [226, 232, 240] as [number,number,number],  // slate-200
};

// ── SVG 레이더 차트 → 캔버스 이미지 변환 ─────────────
async function svgToDataUrl(svgEl: SVGSVGElement, px: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const xml = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = px;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, px, px);
      ctx.drawImage(img, 0, 0, px, px);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png', 0.95));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── PDF 헬퍼: 텍스트 줄바꿈 ──────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function splitText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

// ── 메인: PDF 생성 ────────────────────────────────────
export async function generateStudentPdfReport(
  student: StudentRecord,
  aiComment: AiComment | undefined,
  radarSvgEl?: SVGSVGElement | null
): Promise<void> {
  const { jsPDF } = await loadLibs();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const ML = 18, MR = 18, MT = 20;
  const CW = W - ML - MR;
  let y = MT;

  // ── 폰트 설정 (한글 지원 기본 폰트) ─────────────────
  doc.setFont('helvetica');

  // ══════════════════════════════════════════════════
  //  1. 헤더 배너
  // ══════════════════════════════════════════════════
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, W, 42, 'F');

  // 로고 텍스트
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('QuestIQ', ML, 16);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Question Competency Report', ML, 24);

  // 날짜
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('ko-KR')}`, W - MR, 24, { align: 'right' });

  y = 52;

  // ══════════════════════════════════════════════════
  //  2. 학생 정보 카드
  // ══════════════════════════════════════════════════
  doc.setFillColor(...PDF_COLORS.bg);
  doc.roundedRect(ML, y, CW, 28, 3, 3, 'F');
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 28, 3, 3, 'S');

  doc.setTextColor(...PDF_COLORS.text);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(student.name, ML + 6, y + 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(student.grade, ML + 6, y + 18);
  if (student.group) doc.text(`Group: ${student.group}`, ML + 6, y + 24);

  // 성장 배지 (우측)
  if (student.comparison) {
    const growthInfo = getGrowthInfo(student.comparison.totalImprovement);
    doc.setFillColor(...PDF_COLORS.secondary);
    doc.roundedRect(W - MR - 52, y + 6, 50, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(growthInfo.label, W - MR - 27, y + 16, { align: 'center' });
  }

  y += 36;

  // ══════════════════════════════════════════════════
  //  3. 점수 요약 (3컬럼)
  // ══════════════════════════════════════════════════
  if (student.comparison) {
    const { pre, post, comparison } = student;
    const preLvl  = getLevelInfo(pre!.totalAverage);
    const postLvl = getLevelInfo(post!.totalAverage);

    const cols = [
      { label: 'Pre-Diagnosis', value: pre!.totalAverage.toFixed(2), sub: preLvl.label,  color: PDF_COLORS.primary },
      { label: 'Post-Diagnosis',value: post!.totalAverage.toFixed(2),sub: postLvl.label, color: PDF_COLORS.secondary },
      { label: 'Improvement',   value: `+${comparison.totalImprovement.toFixed(2)}`,
        sub: `${comparison.totalImprovementPct}% growth`, color: PDF_COLORS.success },
    ];

    const colW = (CW - 8) / 3;
    cols.forEach((col, i) => {
      const cx = ML + i * (colW + 4);
      doc.setFillColor(...col.color);
      doc.roundedRect(cx, y, colW, 26, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(col.label, cx + colW / 2, y + 7, { align: 'center' });
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(col.value, cx + colW / 2, y + 17, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(col.sub, cx + colW / 2, y + 23, { align: 'center' });
    });
    y += 34;
  }

  // ══════════════════════════════════════════════════
  //  4. 레이더 차트 이미지
  // ══════════════════════════════════════════════════
  if (radarSvgEl) {
    try {
      const imgData = await svgToDataUrl(radarSvgEl, 600);
      const chartSize = 80;
      const chartX = ML + (CW - chartSize) / 2;
      doc.setFillColor(...PDF_COLORS.bg);
      doc.roundedRect(ML, y, CW, chartSize + 8, 3, 3, 'F');
      doc.addImage(imgData, 'PNG', chartX, y + 4, chartSize, chartSize);

      // 차트 제목
      doc.setTextColor(...PDF_COLORS.muted);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPETENCY RADAR CHART', W / 2, y + 2, { align: 'center' });
      y += chartSize + 16;
    } catch (e) {
      console.warn('레이더 차트 이미지 변환 실패:', e);
      y += 4;
    }
  }

  // ══════════════════════════════════════════════════
  //  5. 구인별 점수 바 테이블
  // ══════════════════════════════════════════════════
  if (student.comparison) {
    doc.setTextColor(...PDF_COLORS.muted);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSTRUCT SCORES', ML, y);
    y += 6;

    const rowH = 10;
    const barMaxW = 60;
    const labelW = 28, preW = 12, postW = 12, impW = 14;

    // 헤더
    doc.setFillColor(...PDF_COLORS.border);
    doc.rect(ML, y, CW, rowH, 'F');
    doc.setTextColor(...PDF_COLORS.muted);
    doc.setFontSize(7);
    ['Construct', 'Pre', 'Post', 'Change', 'Bar'].forEach((h, i) => {
      const xs = [ML+2, ML+labelW, ML+labelW+preW, ML+labelW+preW+postW, ML+labelW+preW+postW+impW];
      doc.text(h, xs[i] + (i === 4 ? barMaxW/2 : 0), y + rowH - 3, { align: i === 4 ? 'center' : 'left' });
    });
    y += rowH;

    student.comparison.constructComparisons.forEach((cc, idx) => {
      const meta = CONSTRUCTS.find(c => c.id === cc.constructId)!;
      const bg = idx % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.bg;
      doc.setFillColor(...bg);
      doc.rect(ML, y, CW, rowH, 'F');

      doc.setTextColor(...PDF_COLORS.text);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(meta.label, ML + 2, y + rowH - 3);

      doc.setTextColor(...PDF_COLORS.primary);
      doc.text(cc.preScore.toFixed(1), ML + labelW, y + rowH - 3);
      doc.setTextColor(...PDF_COLORS.secondary);
      doc.text(cc.postScore.toFixed(1), ML + labelW + preW, y + rowH - 3);

      const impColor = cc.improvement >= 0 ? PDF_COLORS.success : PDF_COLORS.danger;
      doc.setTextColor(...impColor);
      doc.text(`${cc.improvement >= 0 ? '+' : ''}${cc.improvement.toFixed(2)}`, ML + labelW + preW + postW, y + rowH - 3);

      // 바 차트
      const barX = ML + labelW + preW + postW + impW;
      const barY = y + 2.5;
      const barH = 5;
      // 배경
      doc.setFillColor(...PDF_COLORS.border);
      doc.roundedRect(barX, barY, barMaxW, barH, 1, 1, 'F');
      // 사전
      doc.setFillColor(147, 197, 253); // blue-300
      const preBarW = ((cc.preScore - 1) / 4) * barMaxW;
      doc.roundedRect(barX, barY, preBarW, barH/2, 0.5, 0.5, 'F');
      // 사후
      doc.setFillColor(...PDF_COLORS.secondary);
      const postBarW = ((cc.postScore - 1) / 4) * barMaxW;
      doc.roundedRect(barX, barY + barH/2, postBarW, barH/2, 0.5, 0.5, 'F');

      y += rowH;
    });

    // 전체 합계 행
    doc.setFillColor(237, 233, 254); // violet-100
    doc.rect(ML, y, CW, rowH, 'F');
    doc.setTextColor(...PDF_COLORS.text);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Average', ML + 2, y + rowH - 3);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(student.comparison.pre.totalAverage.toFixed(2), ML + labelW, y + rowH - 3);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(student.comparison.post.totalAverage.toFixed(2), ML + labelW + preW, y + rowH - 3);
    const totalImpColor = student.comparison.totalImprovement >= 0 ? PDF_COLORS.success : PDF_COLORS.danger;
    doc.setTextColor(...totalImpColor);
    doc.text(`+${student.comparison.totalImprovement.toFixed(2)}`, ML + labelW + preW + postW, y + rowH - 3);
    y += rowH + 10;
  }

  // ══════════════════════════════════════════════════
  //  6. AI 코멘트 섹션
  // ══════════════════════════════════════════════════
  if (aiComment) {
    // 페이지 넘침 체크
    if (y > H - 80) { doc.addPage(); y = MT; }

    // 헤더
    doc.setFillColor(...PDF_COLORS.primary);
    doc.roundedRect(ML, y, CW, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('AI FEEDBACK', ML + 4, y + 7);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Model: ${aiComment.model}  |  ${new Date(aiComment.generatedAt).toLocaleDateString('ko-KR')}`, W - MR - 2, y + 7, { align: 'right' });
    y += 14;

    // 요약
    doc.setTextColor(...PDF_COLORS.text);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    const summaryLines = doc.splitTextToSize(aiComment.summary, CW - 4);
    doc.text(summaryLines, ML + 2, y);
    y += summaryLines.length * 5 + 6;

    // 항목 렌더
    const sections = [
      { title: 'STRENGTHS', icon: '+', items: aiComment.strengths, color: PDF_COLORS.success },
      { title: 'AREAS TO IMPROVE', icon: '!', items: aiComment.improvements, color: [245, 158, 11] as [number,number,number] },
      { title: 'RECOMMENDED ACTIVITIES', icon: '>', items: aiComment.nextSteps, color: PDF_COLORS.primary },
      { title: 'TEACHER TIPS', icon: '*', items: aiComment.teacherTips, color: PDF_COLORS.secondary },
    ];

    for (const sec of sections) {
      if (y > H - 40) { doc.addPage(); y = MT; }

      doc.setFillColor(...sec.color, 0.15 as any);
      doc.setFillColor(sec.color[0], sec.color[1], sec.color[2]);

      // 섹션 제목
      doc.setTextColor(...sec.color);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(sec.title, ML + 2, y);
      y += 5;

      for (const item of sec.items) {
        if (y > H - 20) { doc.addPage(); y = MT; }
        doc.setTextColor(...PDF_COLORS.text);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(`${sec.icon} ${item}`, CW - 8);
        doc.text(lines, ML + 6, y);
        y += lines.length * 4.5 + 1;
      }
      y += 5;
    }
  }

  // ══════════════════════════════════════════════════
  //  7. 푸터
  // ══════════════════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...PDF_COLORS.border);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setTextColor(...PDF_COLORS.muted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('QuestIQ — AI Student Question Competency System', ML, H - 5);
    doc.text(`Page ${i} / ${totalPages}`, W - MR, H - 5, { align: 'right' });
  }

  // 저장
  const fileName = `QuestIQ_${student.name}_Report_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}

// ── 클래스 전체 PDF ───────────────────────────────────
export async function generateClassPdfReport(
  students: StudentRecord[],
  className: string = '우리 반'
): Promise<void> {
  const { jsPDF } = await loadLibs();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;
  const ML = 15, MR = 15, MT = 15;
  const CW = W - ML - MR;
  let y = MT;

  // 헤더
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`QuestIQ — ${className} Class Report`, ML, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('ko-KR')}  |  Total Students: ${students.length}`, W - MR, 18, { align: 'right' });
  y = 38;

  // 테이블 헤더
  const cols = ['Name', 'Grade', 'Pre Avg', 'Post Avg', 'Improvement', 'Top Construct', 'Level'];
  const colWidths = [28, 28, 22, 22, 22, 36, 22];
  let cx = ML;

  doc.setFillColor(...PDF_COLORS.muted);
  doc.rect(ML, y, CW, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  cols.forEach((col, i) => {
    doc.text(col, cx + 2, y + 6);
    cx += colWidths[i];
  });
  y += 8;

  // 학생 행
  students.forEach((s, idx) => {
    if (y > H - 20) { doc.addPage(); y = MT + 10; }

    const bg = idx % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.bg;
    doc.setFillColor(...bg);
    doc.rect(ML, y, CW, 9, 'F');

    cx = ML;
    doc.setTextColor(...PDF_COLORS.text);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const topId = s.comparison?.mostImprovedConstruct;
    const topMeta = CONSTRUCTS.find(c => c.id === topId);
    const postLevel = s.post ? getLevelInfo(s.post.totalAverage) : null;

    const rowData = [
      s.name,
      s.grade,
      s.pre ? s.pre.totalAverage.toFixed(2) : '—',
      s.post ? s.post.totalAverage.toFixed(2) : '—',
      s.comparison ? `+${s.comparison.totalImprovement.toFixed(2)}` : '—',
      topMeta?.label ?? '—',
      postLevel?.label ?? '—',
    ];

    rowData.forEach((cell, i) => {
      if (i === 4 && s.comparison) {
        doc.setTextColor(...(s.comparison.totalImprovement >= 0 ? PDF_COLORS.success : PDF_COLORS.danger));
      } else {
        doc.setTextColor(...PDF_COLORS.text);
      }
      doc.text(cell, cx + 2, y + 6);
      cx += colWidths[i];
    });
    y += 9;
  });

  doc.save(`QuestIQ_ClassReport_${new Date().toISOString().slice(0,10)}.pdf`);
}
