// src/utils/index.ts
// ─────────────────────────────────────────────────────
// UI 렌더링에 사용되는 유틸리티 함수 모음
// ─────────────────────────────────────────────────────
import type { BloomLevel, LevelBadge, MarzanoType, OpenClosedType } from '../types';

// ── Bloom 레벨별 색상 팔레트 ───────────────────────
export const BLOOM_PALETTE: Record<BloomLevel, {
  bg: string; border: string; text: string; bar: string; light: string;
}> = {
  '기억':  { bg: '#f8fafc', border: '#cbd5e1', text: '#475569', bar: '#94a3b8', light: '#e2e8f0' },
  '이해':  { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', bar: '#3b82f6', light: '#dbeafe' },
  '적용':  { bg: '#f0fdf4', border: '#6ee7b7', text: '#065f46', bar: '#10b981', light: '#d1fae5' },
  '분석':  { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', bar: '#f59e0b', light: '#fef3c7' },
  '평가':  { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', bar: '#f97316', light: '#ffedd5' },
  '창의':  { bg: '#faf5ff', border: '#c4b5fd', text: '#5b21b6', bar: '#8b5cf6', light: '#ede9fe' },
};

// ── 레벨 배지별 스타일 ─────────────────────────────
export const BADGE_STYLES: Record<LevelBadge, {
  gradient: string; shadow: string; emoji: string;
}> = {
  '씨앗형':    { gradient: 'linear-gradient(135deg,#a8edea,#fed6e3)', shadow: '#a8edea44', emoji: '🌱' },
  '새싹형':    { gradient: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)', shadow: '#a1c4fd44', emoji: '🌿' },
  '꽃봉오리형': { gradient: 'linear-gradient(135deg,#ffecd2,#fcb69f)', shadow: '#fcb69f44', emoji: '🌸' },
  '꽃형':      { gradient: 'linear-gradient(135deg,#ff9a9e,#fecfef)', shadow: '#ff9a9e44', emoji: '🌺' },
  '열매형':    { gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', shadow: '#f5576c44', emoji: '🍎' },
};

// ── 마르자노 타입 한글 + 색상 ─────────────────────
export const MARZANO_INFO: Record<MarzanoType, { ko: string; desc: string; color: string }> = {
  detail:      { ko: '세부사항', desc: '명시적 사실 요청', color: '#94a3b8' },
  category:    { ko: '범주',    desc: '개념·속성 파악',  color: '#60a5fa' },
  elaboration: { ko: '정교화', desc: '추론·연결 요구',   color: '#f59e0b' },
  evidence:    { ko: '증거',    desc: '논리·근거 요구',  color: '#8b5cf6' },
};

// ── 점수 → 색상 ───────────────────────────────────
export function scoreToColor(score: number): string {
  if (score <= 3) return '#94a3b8';
  if (score <= 5) return '#60a5fa';
  if (score <= 7) return '#f59e0b';
  if (score <= 9) return '#f97316';
  return '#8b5cf6';
}

// ── 열린/닫힌 배지 스타일 ─────────────────────────
export const OPEN_CLOSED_STYLE: Record<OpenClosedType, {
  label: string; bg: string; text: string; border: string; icon: string;
}> = {
  open:   { label: '열린 질문', bg: '#f0fdf4', text: '#16a34a', border: '#86efac', icon: '🔓' },
  closed: { label: '닫힌 질문', bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', icon: '🔒' },
};

// ── 타임스탬프 포맷 ───────────────────────────────
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

// ── 점수 보정 (범위 클램핑) ───────────────────────
export function clampScore(score: number): number {
  return Math.max(1, Math.min(10, Math.round(score)));
}

// ── Bloom 레벨 한글 → 숫자 ───────────────────────
export const BLOOM_LEVEL_NUM: Record<string, number> = {
  '기억': 1, '이해': 2, '적용': 3, '분석': 4, '평가': 5, '창의': 6,
};

// ── 점수 게이지 퍼센트 ────────────────────────────
export const scoreToPercent = (score: number) => `${(score / 10) * 100}%`;
