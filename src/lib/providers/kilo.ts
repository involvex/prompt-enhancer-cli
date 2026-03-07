/**
 * Kilo-gateway provider implementation
 * Kilo is an LLM router with free and paid models
 * API: https://kilo.ai/  — free models still require an API key from https://app.kilo.ai
 */

import {Provider} from './base.js';
import type {EnhancementOptions, ProviderCredentials} from '../types/index.js';

export const KILO_MODELS = [
	{
		id: 'openrouter/free',
		name: 'OpenRouter Free Router (auto-select free model)',
	},
	{id: 'minimax/minimax-m2.5', name: 'MiniMax M2.5 (recommended)'},
	{id: 'minimax/minimax-m2.1', name: 'MiniMax M2.1'},
	{id: 'minimax/minimax', name: 'MiniMax'},
	{id: 'arcee-ai/trinity-large', name: 'Arcee AI Trinity Large'},
	{id: 'z-ai/glm-4-7-flash-preview', name: 'Z.ai GLM 4.7 Flash Preview (free)'},
	{id: 'qwen/qwen3-coder-next', name: 'Qwen3 Coder Next'},
	{id: 'qwen/qwen3-coder-480b-a35b', name: 'Qwen3 Coder 480B A35B'},
	{id: 'xai/grok-code-fast-1', name: 'xAI Grok Code Fast 1'},
	{id: 'kwaipilot/kat-coder-pro-v1', name: 'KwaiPilot KAT-Coder-Pro V1'},
	{id: 'deepseek/deepseek-chat-v3.1', name: 'DeepSeek V3.1 Terminus'},
];

export const KILO_DEFAULT_ENDPOINT =
	'https://api.kilo.ai/api/gateway/chat/completions';
export const KILO_DEFAULT_MODEL = 'minimax/minimax-m2.5';

interface KiloMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

interface KiloRequestBody {
	messages: KiloMessage[];
	model?: string;
	temperature?: number;
	max_tokens?: number;
	stream?: boolean;
}

const SYSTEM_PROMPT =
	'You are an expert at enhancing and improving user prompts for LLMs. Analyze the given prompt and return an improved version that is clearer, more specific, and more likely to produce better results. Return ONLY the enhanced prompt, no explanations.';

async function throwOnError(response: Response): Promise<never> {
	let body = '';
	try {
		body = await response.text();
	} catch {
		// ignore
	}

	if (body) {
		try {
			const parsed = JSON.parse(body) as {
				error?: {type?: string; message?: string; code?: number};
				message?: string;
			};
			const errorMsg = parsed.error?.message ?? parsed.message;

			if (response.status === 429) {
				throw new Error(
					`Kilo: Rate limited${errorMsg ? ` — ${errorMsg}` : ''}. Wait a moment or use a different model.`,
				);
			}

			if (errorMsg) {
				throw new Error(`Kilo error: ${errorMsg}`);
			}
		} catch (e) {
			if (!(e instanceof SyntaxError)) throw e;
		}
	}

	throw new Error(
		`Kilo API error: ${response.status} ${response.statusText}${body ? ` — ${body}` : ''}`,
	);
}

export class KiloProvider extends Provider {
	private endpoint: string;

	constructor(credentials: ProviderCredentials) {
		super('kilo', credentials, KILO_DEFAULT_MODEL);
		this.endpoint = credentials.endpoint || KILO_DEFAULT_ENDPOINT;
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
		const body: KiloRequestBody = {
			messages: [
				{role: 'system', content: options?.systemPrompt || SYSTEM_PROMPT},
				{role: 'user', content: `Original prompt:\n${prompt}`},
			],
			model: options?.model || this.defaultModel,
			temperature: options?.temperature ?? 0.7,
			max_tokens: options?.maxTokens ?? 1000,
			stream: false,
		};

		const response = await fetch(this.endpoint, {
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
		if (!content) throw new Error('No response received from Kilo');
		return content.trim();
	}

	async *enhanceStream(
		prompt: string,
		options?: EnhancementOptions,
	): AsyncGenerator<string, void, unknown> {
		const body: KiloRequestBody = {
			messages: [
				{role: 'system', content: options?.systemPrompt || SYSTEM_PROMPT},
				{role: 'user', content: `Original prompt:\n${prompt}`},
			],
			model: options?.model || this.defaultModel,
			temperature: options?.temperature ?? 0.7,
			max_tokens: options?.maxTokens ?? 1000,
			stream: true,
		};

		const response = await fetch(this.endpoint, {
			method: 'POST',
			headers: this.buildHeaders(),
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			await throwOnError(response);
		}

		if (!response.body) throw new Error('No response stream from Kilo');

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
								choices?: Array<{delta: {content?: string}}>;
								error?: {type?: string; message?: string; code?: number};
							};
							if (parsed.error) {
								const msg =
									parsed.error.message ?? JSON.stringify(parsed.error);
								throw new Error(`Kilo stream error: ${msg}`);
							}
							const content = parsed.choices?.[0]?.delta?.content;
							if (content) yield content;
						} catch (e) {
							if (e instanceof SyntaxError) continue;
							throw e;
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
		return KILO_MODELS.map(m => m.id);
	}

	async validateCredentials(): Promise<boolean> {
		try {
			const response = await fetch(this.endpoint, {
				method: 'POST',
				headers: this.buildHeaders(),
				body: JSON.stringify({
					messages: [{role: 'user', content: 'test'}],
					model: KILO_DEFAULT_MODEL,
					max_tokens: 1,
					stream: false,
				} satisfies KiloRequestBody),
			});
			return response.ok;
		} catch {
			return false;
		}
	}
}
