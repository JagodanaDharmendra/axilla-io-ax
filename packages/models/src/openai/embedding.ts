import { POST } from '@axflow/models/utils';
import { headers } from './shared';
import type { SharedRequestOptions } from './shared';

const OPENAI_COMPLETIONS_API_URL = 'https://api.openai.com/v1/embeddings';

export namespace OpenAIEmbeddingTypes {
  export type RequestOptions = SharedRequestOptions;

  // https://platform.openai.com/docs/api-reference/embeddings/create
  export type Request = {
    input: string | Array<string> | Array<number> | Array<Array<number>>;
    model: string;
    user?: string;
  };

  export type EmbeddingObject = {
    index: number;
    object: 'embedding';
    embedding: number[];
  };

  export type Response = {
    object: 'list';
    data: EmbeddingObject[];
    model: string;
    usage: {
      prompt_tokens: number;
      total_tokens: number;
    };
  };
}

export async function run(
  request: OpenAIEmbeddingTypes.Request,
  options: OpenAIEmbeddingTypes.RequestOptions,
): Promise<OpenAIEmbeddingTypes.Response> {
  const url = options.apiUrl || OPENAI_COMPLETIONS_API_URL;

  const response = await POST(url, {
    headers: headers(options.apiKey),
    body: JSON.stringify(request),
    fetch: options.fetch,
  });

  return response.json();
}

export class OpenAIEmbedding {
  static run = run;
}
