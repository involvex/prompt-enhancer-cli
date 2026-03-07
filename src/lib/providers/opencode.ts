/**
 * OpenCode provider implementation
 * OpenCode is an AI gateway with an OpenAI-compatible API
 * Models endpoint: https://opencode.ai/zen/v1/models
 * Chat completions: https://opencode.ai/zen/v1/chat/completions
 */

import {Provider} from './base.js';
import type {EnhancementOptions, ProviderCredentials} from '../types/index.js';

export const OPENCODE_BASE_URL = 'https://opencode.ai/zen/v1';
export const OPENCODE_MODELS_ENDPOINT = `${OPENCODE_BASE_URL}/models`;
export const OPENCODE_CHAT_ENDPOINT = `${OPENCODE_BASE_URL}/chat/completions`;
export const OPENCODE_DEFAULT_MODEL = 'anthropic/claude-sonnet-4-5';

interface OpenCodeMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

interface OpenCodeRequestBody {
	messages: OpenCodeMessage[];
	model?: string;
	temperature?: number;
	max_tokens?: number;
	stream?: boolean;
}

interface OpenCodeModel {
	id: string;
	object?: string;
	owned_by?: string;
}

interface OpenCodeModelsResponse {
	data: OpenCodeModel[];
	object?: string;
}

const SYSTEM_PROMPT =
	'You are an expert at enhancing and improving user prompts for LLMs. Analyze the given prompt and return an improved version that is clearer, more specific, and more likely to produce better results. Return ONLY the enhanced prompt, no explanations.';

async function throwOnError(
	response: Response,
	provider = 'OpenCode',
): Promise<never> {
	let body = '';
	try {
		body = await response.text();
	} catch {
		// ignore
	}
	throw new Error(
		`${provider} API error: ${response.status} ${response.statusText}${body ? ` — ${body}` : ''}`,
	);
}

export class OpenCodeProvider extends Provider {
	private chatEndpoint: string;
	private modelsEndpoint: string;

	constructor(credentials: ProviderCredentials) {
		super('opencode', credentials, OPENCODE_DEFAULT_MODEL);
		const base = credentials.endpoint
			? credentials.endpoint.replace(/\/chat\/completions$/, '')
			: OPENCODE_BASE_URL;
		this.chatEndpoint = `${base}/chat/completions`;
		this.modelsEndpoint = `${base}/models`;
	}

	private buildHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};
		if (this.credentials.apiKey) {
			headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
		}
		return headers;
	}

	async enhance(prompt: string, options?: EnhancementOptions): Promise<string> {
		const body: OpenCodeRequestBody = {
			messages: [
				{role: 'system', content: options?.systemPrompt || SYSTEM_PROMPT},
				{role: 'user', content: `Original prompt:\n${prompt}`},
			],
			model: options?.model || this.defaultModel,
			temperature: options?.temperature ?? 0.7,
			max_tokens: options?.maxTokens ?? 1000,
			stream: false,
		};

		const response = await fetch(this.chatEndpoint, {
			method: 'POST',
			headers: this.buildHeaders(),
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			await throwOnError(response);
		}

		const data = (await response.json()) as {
			choices: Array<{message: {content: string}}>;
		};

		const content = data.choices[0]?.message?.content;
		if (!content) throw new Error('No response received from OpenCode');
		return content.trim();
	}

	async *enhanceStream(
		prompt: string,
		options?: EnhancementOptions,
	): AsyncGenerator<string, void, unknown> {
		const body: OpenCodeRequestBody = {
			messages: [
				{role: 'system', content: options?.systemPrompt || SYSTEM_PROMPT},
				{role: 'user', content: `Original prompt:\n${prompt}`},
			],
			model: options?.model || this.defaultModel,
			temperature: options?.temperature ?? 0.7,
			max_tokens: options?.maxTokens ?? 1000,
			stream: true,
		};

		const response = await fetch(this.chatEndpoint, {
			method: 'POST',
			headers: this.buildHeaders(),
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			await throwOnError(response);
		}

		if (!response.body) throw new Error('No response stream from OpenCode');

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		try {
			while (true) {
				const {done, value} = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, {stream: true});
				const lines = buffer.split('\n');

				for (let i = 0; i < lines.length - 1; i++) {
					const line = lines[i]!;
					if (line.startsWith('data: ')) {
						const data = line.slice(6).trim();
						if (data === '[DONE]') return;
						try {
							const parsed = JSON.parse(data) as {
								choices: Array<{delta: {content?: string}}>;
							};
							const content = parsed.choices[0]?.delta?.content;
							if (content) yield content;
						} catch {
							// Ignore malformed SSE chunks
						}
					}
				}

				buffer = lines[lines.length - 1]!;
			}
		} finally {
			reader.releaseLock();
		}
	}

	async getAvailableModels(): Promise<string[]> {
		const response = await fetch(this.modelsEndpoint, {
			headers: this.buildHeaders(),
		});

		if (!response.ok) {
			await throwOnError(response);
		}

		const data = (await response.json()) as OpenCodeModelsResponse;
		return data.data.map(m => m.id).filter(Boolean);
	}

	async validateCredentials(): Promise<boolean> {
		try {
			const response = await fetch(this.modelsEndpoint, {
				headers: this.buildHeaders(),
			});
			return response.ok;
		} catch {
			return false;
		}
	}
}
