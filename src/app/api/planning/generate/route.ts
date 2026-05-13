import { NextResponse } from 'next/server';
import type { PlanningDocument, TemplateType } from '@/types/schedule';

type PlanningAiProvider = 'openai-compatible' | 'gemini' | 'anthropic';

type PlanningGenerateBody = {
  template?: TemplateType;
  planning?: PlanningDocument;
  prompt?: string;
  settings?: {
    provider?: PlanningAiProvider;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  };
};

const templateLabel: Record<TemplateType, string> = {
  film: '영화/단편',
  ad: '광고/브랜디드',
  event: '행사/스케치',
  musicvideo: '뮤직비디오',
  dance: '댄스커버',
};

const projectFormatLabel: Record<NonNullable<PlanningDocument['projectFormat']>, string> = {
  short_film: '단편영화',
  feature_film: '장편영화',
  series: '시리즈/웹드라마',
};

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0',
};

const normalizeBaseUrl = (baseUrl?: string) => {
  const value = (baseUrl || 'https://api.openai.com/v1').trim();
  return value.replace(/\/+$/, '');
};

const buildSystemPrompt = (
  template: TemplateType,
  scale: PlanningDocument['productionScale'],
  projectFormat?: PlanningDocument['projectFormat'],
) => [
  '너는 전문 프로덕션 기획 PD이자 조감독이다.',
  `현재 프로젝트 유형은 ${templateLabel[template]}다.`,
  projectFormat ? `세부 포맷은 ${projectFormatLabel[projectFormat]}다.` : '',
  `제작 규모 기준은 ${scale === 'premium' ? '하이엔드 제작' : scale === 'lean' ? '저예산/소규모 제작' : '스탠다드 제작'}이다.`,
  '응답은 한국어로 작성한다.',
  '기획 기준은 상업 프로덕션의 브리프, 트리트먼트, 스크립트/큐시트 브레이크다운, 촬영 운영안, 납품/권리/리스크 패키지다.',
  template === 'film' ? '단편영화일 경우 러닝타임, 영화제 제출 메타데이터, 감독 소개/statement, 포스터/스틸/EPK, 자막, DCP/ProRes, 권리 클리어런스를 반드시 점검한다.' : '',
  template === 'musicvideo' ? '뮤직비디오일 경우 곡 구조, 가사 타임코드, 립싱크 싱크, 퍼포먼스 커버리지, 내러티브/B-roll, 비주얼 모티프, 스타일링/미술, 음원 권리, 유튜브/숏폼 납품 규격을 반드시 점검한다.' : '',
  template === 'dance' ? '댄스커버일 경우 곡 구조, 타임코드, 가사/비트, 포인트 안무, 멤버 포커스, 대형 변화, FS/CS/LS 샷 사이즈, 원테이크 여부, 사이즈별 촬영, 부족한 인서트 보강, 세로 숏폼 납품, 음원 권리를 반드시 점검한다. 체력 배분과 촬영시간을 고려해 원테이크 반복보다 파트별 촬영+인서트 보강안을 우선 제안할 수 있다.' : '',
  '하이엔드 기준의 누락 항목을 먼저 판단하되, 저예산이면 같은 목표를 달성하는 축약안과 포기 가능한 요소를 함께 제안한다.',
  '추상적인 조언보다 촬영표, 장소 DB, 인원 DB, 콘티 추천으로 옮길 수 있는 실무 항목을 우선한다.',
  '형식은 다음 섹션을 유지한다: 1) 기획 요약 2) 하이엔드 기준 누락 항목 3) 저예산 압축안 4) 촬영 구성 제안 5) 장소/인원/소품 후보 6) 현장 리스크 7) 스케줄 변환 후보.',
  '없는 정보는 지어내지 말고 "확인 필요"로 표시한다.',
].filter(Boolean).join('\n');

const extractOpenAiCompatibleContent = (payload: unknown) => {
  const data = payload as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
};

const extractGeminiContent = (payload: unknown) => {
  const data = payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim() || '';
};

const extractAnthropicContent = (payload: unknown) => {
  const data = payload as { content?: Array<{ type?: string; text?: string }> };
  return data.content?.map((part) => part.text || '').join('\n').trim() || '';
};

const fetchJson = async (url: string, init: RequestInit) => {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = payload as { error?: { message?: string } | string; message?: string };
    const message = typeof errorPayload.error === 'string'
      ? errorPayload.error
      : errorPayload.error?.message || errorPayload.message || `AI provider error (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as PlanningGenerateBody;
    const template = body.template || body.planning?.projectType || 'film';
    const provider = body.settings?.provider || 'openai-compatible';
    const apiKey = body.settings?.apiKey?.trim();
    const model = body.settings?.model?.trim();
    const prompt = body.prompt?.trim();

    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 400, headers: noStoreHeaders });
    }

    if (!prompt) {
      return NextResponse.json({ error: '기획 입력값이 비어 있습니다.' }, { status: 400, headers: noStoreHeaders });
    }

    const system = buildSystemPrompt(template, body.planning?.productionScale || 'standard', body.planning?.projectFormat);
    let content = '';

    if (provider === 'gemini') {
      const geminiModel = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = await fetchJson(url, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${system}\n\n${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 2200,
          },
        }),
      });
      content = extractGeminiContent(payload);
    } else if (provider === 'anthropic') {
      const anthropicModel = model || 'claude-3-5-sonnet-latest';
      const payload = await fetchJson('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: anthropicModel,
          max_tokens: 2200,
          temperature: 0.35,
          system,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      content = extractAnthropicContent(payload);
    } else {
      const baseUrl = normalizeBaseUrl(body.settings?.baseUrl);
      const openAiModel = model || 'gpt-4.1-mini';
      const payload = await fetchJson(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: openAiModel,
          temperature: 0.35,
          max_tokens: 2200,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
        }),
      });
      content = extractOpenAiCompatibleContent(payload);
    }

    if (!content) {
      return NextResponse.json({ error: 'AI 응답을 읽지 못했습니다.' }, { status: 502, headers: noStoreHeaders });
    }

    return NextResponse.json({ content }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 기획 생성 실패' },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
