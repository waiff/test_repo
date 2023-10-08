import { PolyfilledTextDecoderStream } from '../utils/TextDecoderStreamPolyfill';

type RequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  baseUrl?: string;
  headers?: Record<string, string>;
  onMessage?: (message: string) => void;
  onComplete?: () => void;
  abortSignal?: AbortSignal;
};

export async function* getMessages(response: Response) {
  if (!response.body) {
    throw new Error('No response body for stream chat request');
  }

  const reader = response.body
    .pipeThrough(new PolyfilledTextDecoderStream())
    .getReader();

  let done = false;
  while (!done) {
    // eslint-disable-next-line no-await-in-loop
    const result = await reader.read();
    const { value } = result;
    done = result.done;

    if (done) {
      break;
    }

    if (!value) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const chunks = value.split('\n\n').filter((chunk) => !!chunk);

    for (const chunk of chunks) {
      if (chunk.startsWith('data:')) {
        const data = chunk.replace(/^data:\s*/i, '').trim();
        yield { type: 'data', data };
      } else if (chunk !== '\n') {
        console.warn('unhandled message');
      }
    }
  }
}

export function getStreamText(dataString: string): string {
  const data = JSON.parse(dataString) as { content: string };

  return data.content || '';
}

export class StreamService {
  constructor(private readonly defaultConfig: RequestConfig = {}) {}

  private async request(
    path: string,
    body?: string | Record<string, any>,
    config?: RequestConfig,
  ) {
    const baseUrl =
      config?.baseUrl ?? this.defaultConfig.baseUrl ?? window.location.origin;
    const method = config?.method ?? this.defaultConfig.method ?? 'GET';
    const headers = config?.headers ?? this.defaultConfig.headers ?? {};

    const url = new URL(path, baseUrl);
    const response = await fetch(url, {
      method,
      body: JSON.stringify(body),
      headers: {
        ...headers,
        accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      signal: config?.abortSignal,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body for stream chat request');
    }

    return response;
  }

  public async post(
    path: string,
    body: string | Record<string, any>,
    config: RequestConfig,
  ) {
    return this.request(path, body, { ...config, method: 'POST' });
  }

  public async get(path: string, config?: RequestConfig) {
    return this.request(path, undefined, { ...config, method: 'GET' });
  }

  public async put(
    path: string,
    body: string | Record<string, any>,
    config: RequestConfig,
  ) {
    return this.request(path, body, { ...config, method: 'PUT' });
  }

  public async delete(path: string, config?: RequestConfig) {
    return this.request(path, undefined, { ...config, method: 'DELETE' });
  }
}
