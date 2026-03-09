// src/services/aiCommentService.ts
// ─────────────────────────────────────────────────────────────────────────────
// AI 맞춤 피드백 생성 서비스
// 백엔드 /api/v1/classify/improve 엔드포인트를 활용하여
// 학생의 사전-사후 비교 데이터 기반 맞춤 피드백 생성
// ─────────────────────────────────────────────────────────────────────────────
import type { StudentRecord, AiComment } from '../types/teacher';
import type { ConstructId } from '../types/diagnostic';
import { CONSTRUCTS, getGrowthInfo, getLevelInfo } from '../data/diagnosticData';
import { getApiBaseUrl } from './questiqApi';

// ── 진단 데이터 → 자연어 프롬프트 변환 ───────────────
function buildDiagnosticPrompt(student: StudentRecord): string {
  const { comparison, pre, post } = student;
  if (!comparison || !pre || !post) return '';

  const constructLines = comparison.constructComparisons.map(cc => {
    const meta = CONSTRUCTS.find(c => c.id === cc.constructId)!;
    const arrow = cc.improvement > 0 ? '▲' : cc.improvement < 0 ? '▼' : '─';
    return `  • ${meta.label}(${meta.labelShort}): 사전 ${cc.preScore.toFixed(1)}→ 사후 ${cc.postScore.toFixed(1)} ${arrow}${Math.abs(cc.improvement).toFixed(1)} ${cc.isSignificant ? '[유의미]' : ''}`;
  }).join('\n');

  const growthInfo = getGrowthInfo(comparison.totalImprovement);
  const preLevelInfo = getLevelInfo(pre.totalAverage);
  const postLevelInfo = getLevelInfo(post.totalAverage);

  return `[학생 질문 역량 사전-사후 진단 보고서]
학생명: ${student.name}
학년: ${student.grade}

■ 전체 성장 요약
  사전 평균: ${pre.totalAverage.toFixed(2)}점 (${preLevelInfo.label})
  사후 평균: ${post.totalAverage.toFixed(2)}점 (${postLevelInfo.label})
  전체 향상: +${comparison.totalImprovement.toFixed(2)}점 (${comparison.totalImprovementPct}%) → ${growthInfo.label}

■ 6구인(질문 역량) 사전-사후 변화
${constructLines}

■ 가장 많이 향상된 구인: ${CONSTRUCTS.find(c => c.id === comparison.mostImprovedConstruct)?.label}
■ 가장 적게 향상된 구인: ${CONSTRUCTS.find(c => c.id === comparison.leastImprovedConstruct)?.label}

위 데이터를 바탕으로 이 학생의 질문 역량 향상에 대한 교육적 피드백을 작성해주세요.
피드백은 다음 항목을 포함해야 합니다:
1. 종합 요약 (2-3문장, 학생에게 직접 전달할 수 있는 따뜻하고 구체적인 내용)
2. 잘한 점 / 강점 2가지 (구인명 포함, 구체적 칭찬)
3. 더 성장할 영역 2가지 (구인명 포함, 건설적 제안)
4. 권장 활동 3가지 (실제 수업에서 적용 가능한 QFT/Bloom 기반 활동)
5. 교사를 위한 지도 팁 2가지

반드시 JSON 형식으로만 응답하세요:
{
  "summary": "종합 요약 문장",
  "strengths": ["강점1", "강점2"],
  "improvements": ["개선점1", "개선점2"],
  "nextSteps": ["활동1", "활동2", "활동3"],
  "teacherTips": ["팁1", "팁2"]
}`;
}

// ── API 호출 (실제 백엔드 연동) ───────────────────────
async function fetchAiCommentFromApi(prompt: string): Promise<{
  summary: string; strengths: string[]; improvements: string[]; nextSteps: string[]; teacherTips: string[];
  model: string; tokensUsed?: number;
}> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/classify/improve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: prompt,
      grade: '중학교',
      subject: '질문 역량 진단',
      context: 'teacher_feedback',
    }),
    signal: AbortSignal.timeout(40000),
  });

  if (!response.ok) {
    throw new Error(`API 응답 오류: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // 백엔드가 improved_question / feedback 필드로 반환하므로 파싱
  const rawText: string = data.data?.improved_question || data.data?.feedback || '';
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('JSON 파싱 실패: 응답에 JSON 없음');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    ...parsed,
    model: data.data?.meta?.model_used || 'gpt-4o',
    tokensUsed: data.data?.meta?.tokens_used,
  };
}

// ── 폴백: 규칙 기반 피드백 생성 (API 실패 시) ─────────
function buildFallbackComment(student: StudentRecord): {
  summary: string; strengths: string[]; improvements: string[]; nextSteps: string[]; teacherTips: string[];
  model: string;
} {
  const { comparison } = student;
  if (!comparison) throw new Error('comparison 없음');

  const sorted = [...comparison.constructComparisons].sort((a, b) => b.improvement - a.improvement);
  const top2 = sorted.slice(0, 2);
  const bottom2 = sorted.slice(-2);
  const growthInfo = getGrowthInfo(comparison.totalImprovement);

  const constructLabel = (id: ConstructId) => CONSTRUCTS.find(c => c.id === id)?.label ?? id;

  return {
    summary: `${student.name} 학생은 이번 QuestIQ 프로그램을 통해 질문 역량에서 ${growthInfo.label}을 이루었습니다. ` +
      `전체 평균이 ${comparison.pre.totalAverage.toFixed(2)}점에서 ${comparison.post.totalAverage.toFixed(2)}점으로 향상되어 정말 자랑스럽습니다! ` +
      `앞으로도 꾸준히 질문하는 습관을 이어가면 더 큰 성장을 이룰 수 있습니다.`,
    strengths: top2.map(cc =>
      `${constructLabel(cc.constructId)} 영역에서 ${cc.improvement.toFixed(2)}점 향상 (${cc.improvementPct}% 성장) — ` +
      (cc.isSignificant ? '교육적으로 유의미한 성장입니다!' : '꾸준한 노력의 결과입니다.')
    ),
    improvements: bottom2.map(cc =>
      `${constructLabel(cc.constructId)} 영역(현재 ${cc.postScore.toFixed(1)}점) — ` +
      '더 많은 연습을 통해 추가 성장 가능성이 있습니다.'
    ),
    nextSteps: [
      '📝 질문 일기 쓰기: 매일 수업 후 궁금했던 점을 열린 질문으로 1개 이상 기록하세요.',
      '🎯 QFT 4단계 연습: 하나의 주제로 질문 폭발 → 분류 → 개선 → 성찰 사이클을 반복하세요.',
      '🌱 블룸 사다리 오르기: 기억·이해 수준 질문을 분석·평가·창조 수준으로 업그레이드 해보세요.',
    ],
    teacherTips: [
      `${constructLabel(bottom2[0].constructId)} 영역 집중 지도: 짝 질문 활동, 소그룹 질문 피드백 세션을 늘려보세요.`,
      `강점인 ${constructLabel(top2[0].constructId)} 역량을 모둠 활동 리더 역할에 활용하면 자신감과 역량이 동시에 성장합니다.`,
    ],
    model: 'rule-based-fallback',
  };
}

// ── 메인 엔트리: AI 코멘트 생성 ──────────────────────
export async function generateAiComment(student: StudentRecord): Promise<AiComment> {
  if (!student.comparison) throw new Error('사전-사후 비교 데이터가 없습니다.');

  const prompt = buildDiagnosticPrompt(student);
  let result: ReturnType<typeof buildFallbackComment>;

  try {
    result = await fetchAiCommentFromApi(prompt);
  } catch (err) {
    console.warn('[aiCommentService] API 실패, 폴백 사용:', err);
    result = buildFallbackComment(student);
  }

  return {
    studentId: student.id,
    summary: result.summary,
    strengths: result.strengths,
    improvements: result.improvements,
    nextSteps: result.nextSteps,
    teacherTips: result.teacherTips,
    generatedAt: new Date().toISOString(),
    model: result.model,
    tokensUsed: (result as any).tokensUsed,
  };
}
