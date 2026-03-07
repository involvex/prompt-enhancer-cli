/**
 * Kilo-gateway provider implementation
 * Kilo is a free and open LLM router that uses free models
 * API: https://kilo.run/
 */

import {Provider} from './base.js';
import type {EnhancementOptions, ProviderCredentials} from '../types/index.js';

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

export class KiloProvider extends Provider {
	private endpoint: string;

	constructor(credentials: ProviderCredentials) {
		super('kilo', credentials, 'auto');

		// Kilo is free and may not require API key, but can accept one
		this.endpoint =
			credentials.endpoint || 'https://api.kilo.run/openai/v1/chat/completions';
	}

	async enhance(prompt: string, options?: EnhancementOptions): Promise<string> {
		const systemPrompt =
			options?.systemPrompt ||
			'You are an expert at enhancing and improving user prompts for LLMs. Analyze the given prompt and return an improved version that is clearer, more specific, and more likely to produce better results. Return ONLY the enhanced prompt, no explanations.';

		const body: KiloRequestBody = {
			messages: [
				{
					role: 'system',
					content: systemPrompt,
				},
				{
					role: 'user',
					content: `Original prompt:\n${prompt}`,
				},
			],
			model: options?.model || this.defaultModel,
			temperature: options?.temperature || 0.7,
			max_tokens: options?.maxTokens || 1000,
			stream: false,
		};

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (this.credentials.apiKey && this.credentials.apiKey !== 'free') {
			headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
		}

		const response = await fetch(this.endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(
				`Kilo API error: ${response.status} ${response.statusText}`,
			);
		}

		const data = (await response.json()) as {
			choices: Array<{message: {content: string}}>;
		};

		const content = data.choices[0]?.message?.content;

		if (!content) {
			throw new Error('No response received from Kilo');
		}

		return content.trim();
	}

	async *enhanceStream(
		prompt: string,
		options?: EnhancementOptions,
	): AsyncGenerator<string, void, unknown> {
		const systemPrompt =
			options?.systemPrompt ||
			'You are an expert at enhancing and improving user prompts for LLMs. Analyze the given prompt and return an improved version that is clearer, more specific, and more likely to produce better results. Return ONLY the enhanced prompt, no explanations.';

		const body: KiloRequestBody = {
			messages: [
				{
					role: 'system',
					content: systemPrompt,
				},
				{
					role: 'user',
					content: `Original prompt:\n${prompt}`,
				},
			],
			model: options?.model || this.defaultModel,
			temperature: options?.temperature || 0.7,
			max_tokens: options?.maxTokens || 1000,
			stream: true,
		};

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (this.credentials.apiKey && this.credentials.apiKey !== 'free') {
			headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
		}

		const response = await fetch(this.endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(
				`Kilo API error: ${response.status} ${response.statusText}`,
			);
		}

		if (!response.body) {
			throw new Error('No response stream from Kilo');
		}

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
						const data = line.slice(6);
						if (data === '[DONE]') break;

						try {
							const parsed = JSON.parse(data) as {
								choices: Array<{delta: {content?: string}}>;
							};
							const content = parsed.choices[0]?.delta?.content;
							if (content) {
								yield content;
							}
						} catch {
							// Ignore parse errors
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
		// Kilo supports various free models
		return ['auto', 'gpt-3.5-turbo', 'gpt-4o-mini', 'claude-3-5-sonnet'];
	}

	async validateCredentials(): Promise<boolean> {
		try {
			const body: KiloRequestBody = {
				messages: [
					{
						role: 'user',
						content: 'test',
					},
				],
				model: 'auto',
				max_tokens: 1,
				stream: false,
			};

			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			};

			if (this.credentials.apiKey && this.credentials.apiKey !== 'free') {
				headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
			}

			const response = await fetch(this.endpoint, {
				method: 'POST',
				headers,
				body: JSON.stringify(body),
			});

			return response.ok;
		} catch {
			return false;
		}
	}
}
