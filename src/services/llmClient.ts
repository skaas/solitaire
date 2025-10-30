export interface LLMMessage {
  role: 'system' | 'user';
  content: string;
}

interface RequestOptions {
  signal?: AbortSignal;
}

interface FortuneSummaryResponse {
  summary?: string;
  error?: string;
  detail?: unknown;
}

export async function requestFortuneSummary(
  messages: LLMMessage[],
  options: RequestOptions = {},
): Promise<string> {
  const response = await fetch('/api/fortune-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: options.signal,
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    let errorMessage = `요약 API 호출이 실패했습니다. (HTTP ${response.status})`;

    try {
      const errorBody = (await response.json()) as FortuneSummaryResponse;
      if (errorBody.error) {
        errorMessage = `${errorMessage}: ${errorBody.error}`;
      }
    } catch (error) {
      // 응답 본문이 JSON이 아닌 경우 무시하고 기본 메시지만 사용
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as FortuneSummaryResponse;

  if (data.summary && data.summary.trim().length > 0) {
    return data.summary.trim();
  }

  if (data.error) {
    throw new Error(data.error);
  }

  throw new Error('요약 결과가 비어 있습니다.');
}



