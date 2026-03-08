// src/data/diagnosticData.ts
// ─────────────────────────────────────────────────────────────────────────────
// KCI 논문 기반 6구인 메타데이터 및 25문항 설문 데이터
// "학생 질문 능력의 자기진단 평가도구 개발 및 타당화" (ART003161879)
// ─────────────────────────────────────────────────────────────────────────────
import type { ConstructMeta, DiagnosticItem } from '../types/diagnostic';

// ══════════════════════════════════════════════════════
//  6구인 메타데이터
// ══════════════════════════════════════════════════════
export const CONSTRUCTS: ConstructMeta[] = [
  {
    id: 'awareness',
    label: '질문 인식',
    labelShort: '인식',
    description: '질문의 가치와 중요성을 이해하고 질문하려는 태도',
    emoji: '👁',
    color: '#6366f1',
    lightColor: '#eef2ff',
  },
  {
    id: 'generation',
    label: '질문 생성',
    labelShort: '생성',
    description: '다양한 질문을 자유롭게 만들어내는 능력',
    emoji: '✨',
    color: '#10b981',
    lightColor: '#ecfdf5',
  },
  {
    id: 'refinement',
    label: '질문 정교화',
    labelShort: '정교화',
    description: '만든 질문을 더 명확하고 깊이 있게 다듬는 능력',
    emoji: '🔧',
    color: '#f59e0b',
    lightColor: '#fffbeb',
  },
  {
    id: 'classification',
    label: '질문 분류',
    labelShort: '분류',
    description: '질문 유형(열린/닫힌, 블룸 수준 등)을 구분하는 능력',
    emoji: '🗂',
    color: '#f97316',
    lightColor: '#fff7ed',
  },
  {
    id: 'inquiry',
    label: '질문 탐구',
    labelShort: '탐구',
    description: '질문을 활용하여 지식을 탐구·확장하는 능력',
    emoji: '🔍',
    color: '#ec4899',
    lightColor: '#fdf2f8',
  },
  {
    id: 'reflection',
    label: '질문 성찰',
    labelShort: '성찰',
    description: '자신의 질문 과정을 돌아보고 개선하는 메타인지 능력',
    emoji: '💭',
    color: '#8b5cf6',
    lightColor: '#f5f3ff',
  },
];

// ══════════════════════════════════════════════════════
//  25문항 설문지
//  (KCI 논문 원문 기반 재구성, 교육 현장 적용 최적화)
// ══════════════════════════════════════════════════════
export const DIAGNOSTIC_ITEMS: DiagnosticItem[] = [
  // ── 구인 1: 질문 인식 (4문항) ──────────────────────
  {
    id: 'aw_01', constructId: 'awareness',
    text: '나는 수업 중에 궁금한 것이 생기면 질문하는 것이 중요하다고 생각한다.',
  },
  {
    id: 'aw_02', constructId: 'awareness',
    text: '나는 좋은 질문을 하는 것이 공부에 도움이 된다고 생각한다.',
  },
  {
    id: 'aw_03', constructId: 'awareness',
    text: '나는 질문을 통해 새로운 것을 배울 수 있다고 생각한다.',
  },
  {
    id: 'aw_04', constructId: 'awareness',
    text: '나는 친구들이 질문하는 것을 들으면 나도 질문하고 싶어진다.',
  },

  // ── 구인 2: 질문 생성 (5문항) ──────────────────────
  {
    id: 'ge_01', constructId: 'generation',
    text: '나는 새로운 내용을 배울 때 스스로 질문을 만들어 본다.',
  },
  {
    id: 'ge_02', constructId: 'generation',
    text: '나는 하나의 주제에 대해 다양한 질문을 여러 개 만들 수 있다.',
  },
  {
    id: 'ge_03', constructId: 'generation',
    text: '나는 "왜?", "만약에?", "어떻게?"와 같은 질문을 자주 만든다.',
  },
  {
    id: 'ge_04', constructId: 'generation',
    text: '나는 책이나 자료를 읽으면서 궁금한 점을 질문으로 기록한다.',
  },
  {
    id: 'ge_05', constructId: 'generation',
    text: '나는 짧은 시간 안에도 많은 질문을 만들어낼 수 있다.',
  },

  // ── 구인 3: 질문 정교화 (4문항) ──────────────────────
  {
    id: 're_01', constructId: 'refinement',
    text: '나는 처음 만든 질문을 더 좋은 질문으로 다듬을 수 있다.',
  },
  {
    id: 're_02', constructId: 'refinement',
    text: '나는 닫힌 질문(예/아니오로 답할 수 있는)을 열린 질문으로 바꿀 수 있다.',
  },
  {
    id: 're_03', constructId: 'refinement',
    text: '나는 너무 쉬운 질문을 더 깊이 있는 질문으로 발전시킬 수 있다.',
  },
  {
    id: 're_04', constructId: 'refinement',
    text: '나는 질문에 더 많은 정보를 담아 구체적으로 만들 수 있다.',
  },

  // ── 구인 4: 질문 분류 (4문항) ──────────────────────
  {
    id: 'cl_01', constructId: 'classification',
    text: '나는 내가 만든 질문이 사실을 묻는 것인지, 의견을 묻는 것인지 구분할 수 있다.',
  },
  {
    id: 'cl_02', constructId: 'classification',
    text: '나는 열린 질문과 닫힌 질문의 차이를 알고 구분할 수 있다.',
  },
  {
    id: 'cl_03', constructId: 'classification',
    text: '나는 단순히 기억을 묻는 질문과 생각을 요구하는 질문을 구분할 수 있다.',
  },
  {
    id: 'cl_04', constructId: 'classification',
    text: '나는 여러 질문들 중에서 가장 탐구 가치가 높은 질문을 고를 수 있다.',
  },

  // ── 구인 5: 질문 탐구 (4문항) ──────────────────────
  {
    id: 'in_01', constructId: 'inquiry',
    text: '나는 질문을 시작점으로 삼아 더 깊이 탐구한 경험이 있다.',
  },
  {
    id: 'in_02', constructId: 'inquiry',
    text: '나는 내 질문에 답을 찾기 위해 다양한 자료를 찾아본다.',
  },
  {
    id: 'in_03', constructId: 'inquiry',
    text: '나는 질문 하나가 새로운 질문으로 이어지는 경험을 한다.',
  },
  {
    id: 'in_04', constructId: 'inquiry',
    text: '나는 친구나 선생님과 질문을 주고받으며 새로운 것을 알게 된다.',
  },

  // ── 구인 6: 질문 성찰 (4문항) ──────────────────────
  {
    id: 'rf_01', constructId: 'reflection',
    text: '나는 내가 만든 질문이 좋은 질문인지 스스로 평가해 본다.',
  },
  {
    id: 'rf_02', constructId: 'reflection',
    text: '나는 질문을 만든 후 "더 나은 질문은 없을까?"라고 생각해 본다.',
  },
  {
    id: 'rf_03', constructId: 'reflection',
    text: '나는 수업이 끝난 후 오늘 내가 한 질문들을 돌아본다.',
  },
  {
    id: 'rf_04', constructId: 'reflection',
    text: '나는 내 질문 습관이 어떻게 발전하고 있는지 관찰한다.',
  },
];

// ── 구인별 문항 그룹화 헬퍼 ──────────────────────────
export function getItemsByConstruct(constructId: string): DiagnosticItem[] {
  return DIAGNOSTIC_ITEMS.filter(item => item.constructId === constructId);
}

// ── 구인 메타데이터 조회 헬퍼 ─────────────────────────
export function getConstructMeta(id: string): ConstructMeta {
  return CONSTRUCTS.find(c => c.id === id) ?? CONSTRUCTS[0];
}

// ── 수준 판정 기준표 ──────────────────────────────────
export const LEVEL_THRESHOLDS = [
  { min: 4.2, max: 5.0, level: 'very_high',  label: '열매 단계', emoji: '🍎', color: '#8b5cf6' },
  { min: 3.4, max: 4.2, level: 'high',       label: '개화 단계', emoji: '🌺', color: '#f97316' },
  { min: 2.6, max: 3.4, level: 'medium',     label: '성장 단계', emoji: '🌸', color: '#f59e0b' },
  { min: 1.8, max: 2.6, level: 'low',        label: '새싹 단계', emoji: '🌿', color: '#10b981' },
  { min: 1.0, max: 1.8, level: 'very_low',   label: '씨앗 단계', emoji: '🌱', color: '#94a3b8' },
] as const;

export function getLevelInfo(avg: number) {
  return LEVEL_THRESHOLDS.find(t => avg >= t.min && avg < t.max + 0.01)
    ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}

// ── 성장 등급 기준표 ──────────────────────────────────
export const GROWTH_THRESHOLDS = [
  { min: 1.5,  level: 'remarkable',  label: '눈부신 성장', emoji: '🚀', color: '#8b5cf6' },
  { min: 0.8,  level: 'significant', label: '뚜렷한 성장', emoji: '⬆️',  color: '#6366f1' },
  { min: 0.3,  level: 'moderate',    label: '꾸준한 성장', emoji: '📈',  color: '#10b981' },
  { min: 0.01, level: 'slight',      label: '미미한 성장', emoji: '➡️',  color: '#f59e0b' },
  { min: -99,  level: 'declined',    label: '다시 도전',   emoji: '💪',  color: '#ef4444' },
] as const;

export function getGrowthInfo(improvement: number) {
  return GROWTH_THRESHOLDS.find(t => improvement >= t.min)
    ?? GROWTH_THRESHOLDS[GROWTH_THRESHOLDS.length - 1];
}
