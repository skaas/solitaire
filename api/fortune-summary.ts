export const config = {
  runtime: 'edge',
};

interface LLMMessage {
  role: 'system' | 'user';
  content: string;
}

interface OpenAIResponseChunk {
  content: Array<{ type: string; text?: string }>;
}

interface OpenAIResponseBody {
  output_text?: string;
  output?: OpenAIResponseChunk[];
  error?: { message?: string };
}

function toResponseInput(messages: LLMMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: [
      {
        type: 'text' as const,
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

function extractSummary(data: OpenAIResponseBody): string | null {
  if (typeof data.output_text === 'string' && data.output_text.trim().length > 0) {
    return data.output_text.trim();
  }

  if (Array.isArray(data.output)) {
    const joined = data.output
      .flatMap((chunk) =>
        chunk.content
          .map((part) => ('text' in part && part.text ? part.text : ''))
          .filter((segment) => segment.trim().length > 0),
      )
      .join('\n')
      .trim();

    if (joined.length > 0) {
      return joined;
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

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonResponse({ error: '서버 환경 변수 OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-5';
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  try {
    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: toResponseInput(messages),
        max_output_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return jsonResponse(
        {
          error: 'OpenAI API 호출이 실패했습니다.',
          status: response.status,
          detail: errorBody,
        },
        { status: 502 },
      );
    }

    const data = (await response.json()) as OpenAIResponseBody;
    const summary = extractSummary(data);

    if (!summary) {
      return jsonResponse(
        {
          error: 'OpenAI 응답에서 요약 텍스트를 찾을 수 없습니다.',
        },
        { status: 502 },
      );
    }

    return jsonResponse({ summary });
  } catch (error) {
    return jsonResponse(
      {
        error: '요약 생성 중 서버 오류가 발생했습니다.',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

