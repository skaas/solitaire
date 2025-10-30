export const config = {
  runtime: 'edge',
};

interface LLMMessage {
  role: 'system' | 'user';
  content: string;
}

interface OpenAIIncompleteDetails {
  reason?: string;
}

interface OpenAIResponseContentPart {
  type: string;
  text?: string;
}

interface OpenAIResponseItem {
  role?: string;
  content: OpenAIResponseContentPart[];
}

interface OpenAIResponsesBody {
  output_text?: string;
  output?: OpenAIResponseItem[];
  status?: string;
  incomplete_details?: OpenAIIncompleteDetails | null;
}

function toResponseInput(messages: LLMMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: [
      {
        type: 'input_text' as const,
        text: message.content,
      },
    ],
  }));
}

function jsonResponse<T>(body: T, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

function extractSummary(data: OpenAIResponsesBody): string | null {
  if (typeof data.output_text === 'string' && data.output_text.trim().length > 0) {
    return data.output_text.trim();
  }

  if (Array.isArray(data.output)) {
    const text = data.output
      .flatMap((item) =>
        Array.isArray(item.content)
          ? item.content
              .map((part) => part.text?.trim() ?? '')
              .filter((segment) => segment.length > 0)
          : [],
      )
      .join('\n')
      .trim();

    if (text.length > 0) {
      return text;
    }
  }

  return null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, { status: 405 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse(
      { error: '잘못된 JSON 요청 본문입니다.', detail: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }

  const messages = (payload as { messages?: LLMMessage[] }).messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: 'messages 배열이 필요합니다.' }, { status: 400 });
  }

  const env = ((globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
    ENV?: Record<string, string | undefined>;
  }).process?.env ?? (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
    ENV?: Record<string, string | undefined>;
  }).ENV ?? {}) as Record<string, string | undefined>;

  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonResponse({ error: '서버 환경 변수 OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const model = env.OPENAI_MODEL ?? 'gpt-5';
  const baseUrl = env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  try {
    console.log('[fortune-summary] 요청 시작', {
      model,
      baseUrl,
      messageCount: messages.length,
    });

    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: toResponseInput(messages),
        max_output_tokens: 1200,
        modalities: ['text'],
        reasoning: { effort: 'medium' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[fortune-summary] OpenAI API 실패', {
        status: response.status,
        statusText: response.statusText,
        bodySnippet: errorBody.slice(0, 500),
      });
      return jsonResponse(
        {
          error: 'OpenAI API 호출이 실패했습니다.',
          status: response.status,
          detail: errorBody,
        },
        { status: 502 },
      );
    }

    const data = (await response.json()) as OpenAIResponsesBody;
    console.log('[fortune-summary] OpenAI 응답', {
      hasOutputText: typeof data.output_text === 'string',
      outputLength: data.output?.length ?? 0,
      status: data.status,
      incompleteReason: data.incomplete_details?.reason,
    });

    if (data.status === 'incomplete') {
      const reason = data.incomplete_details?.reason ?? 'unknown';
      console.error('[fortune-summary] 응답이 미완료 상태로 종료되었습니다.', reason);
      return jsonResponse(
        {
          error: `OpenAI 응답이 완료되지 않았습니다. (이유: ${reason})`,
        },
        { status: 502 },
      );
    }

    const summary = extractSummary(data);

    if (!summary) {
      console.error('[fortune-summary] 응답 파싱 실패', data);
      return jsonResponse(
        {
          error: 'OpenAI 응답에서 요약 텍스트를 찾을 수 없습니다.',
        },
        { status: 502 },
      );
    }

    return jsonResponse({ summary });
  } catch (error) {
    console.error('[fortune-summary] 요약 생성 중 예외 발생', error);
    return jsonResponse(
      {
        error: '요약 생성 중 서버 오류가 발생했습니다.',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

