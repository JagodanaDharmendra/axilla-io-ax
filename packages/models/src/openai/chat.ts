import { POST, HttpError } from '@axflow/models/utils';
import { headers, streamTransformer } from './shared';
import type { SharedRequestOptions } from './shared';

const OPENAI_CHAT_COMPLETIONS_API_URL = 'https://api.openai.com/v1/chat/completions';

export namespace OpenAIChatTypes {
  export type RequestOptions = SharedRequestOptions;

  // https://platform.openai.com/docs/api-reference/chat/create
  export type Request = {
    model: string;
    messages: Message[];
    functions?: Array<{
      name: string;
      parameters: Record<string, unknown>;
      description?: string;
    }>;
    function_call?: 'none' | 'auto' | { name: string };
    temperature?: number | null;
    top_p?: number | null;
    n?: number | null;
    stop?: string | null | Array<string>;
    max_tokens?: number;
    presence_penalty?: number | null;
    frequency_penalty?: number | null;
    logit_bias?: Record<string, number> | null;
    user?: string;
  };

  export type Message = {
    role: 'system' | 'user' | 'assistant' | 'function';
    name?: string;
    content: string | null;
    function_call?: {
      name: string;
      arguments: string;
    };
  };

  // https://platform.openai.com/docs/api-reference/chat/object
  export type Response = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
      index: number;
      finish_reason: 'stop' | 'length' | 'function_call' | null;
      message: Message;
    }>;
    usage?: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    };
  };

  // https://platform.openai.com/docs/api-reference/chat/streaming
  export type Chunk = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
      index: number;
      delta: Delta;
      finish_reason: 'stop' | 'length' | 'function_call' | null;
    }>;
  };

  export type Delta = {
    role?: 'system' | 'user' | 'assistant' | 'function';
    content?: string | null;
    function_call?: {
      name?: string;
      arguments?: string;
    };
  };
}

export async function run(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions,
): Promise<OpenAIChatTypes.Response> {
  const url = options.apiUrl || OPENAI_CHAT_COMPLETIONS_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey),
    body: JSON.stringify({ ...request, stream: false }),
    fetch: options.fetch,
  });

  return response.json();
}

export async function streamBytes(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions,
): Promise<ReadableStream<Uint8Array>> {
  const url = options.apiUrl || OPENAI_CHAT_COMPLETIONS_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey),
    body: JSON.stringify({ ...request, stream: true }),
    fetch: options.fetch,
  });

  if (!response.body) {
    throw new HttpError('Expected response body to be a ReadableStream', response);
  }

  return response.body;
}

export async function stream(
  request: OpenAIChatTypes.Request,
  options: OpenAIChatTypes.RequestOptions,
): Promise<ReadableStream<OpenAIChatTypes.Chunk>> {
  const byteStream = await streamBytes(request, options);

  const chunkTransformerStream = new TransformStream<string, OpenAIChatTypes.Chunk>({
    transform: streamTransformer(),
  });

  return byteStream
    .pipeThrough(new TextDecoderStream()) // Raw bytes  => JS strings
    .pipeThrough(chunkTransformerStream); // JS strings => OpenAIChatTypes.Chunk objects
}

export class OpenAIChat {
  static run = run;
  static stream = stream;
  static streamBytes = streamBytes;
}
