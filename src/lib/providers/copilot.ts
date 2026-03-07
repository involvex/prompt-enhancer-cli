/**
 * GitHub Copilot provider implementation
 * Uses OpenAI-compatible API.
 * Auto-detects OAuth token from ~/.copilot/ and other well-known paths;
 * falls back to manually-configured apiKey.
 */

import {OpenAI} from 'openai';
import {Provider} from './base.js';
import type {EnhancementOptions, ProviderCredentials} from '../types/index.js';
import {getCopilotToken} from '../utils/copilot-auth.js';

export class CopilotProvider extends Provider {
	private client!: OpenAI;
	private initialized = false;

	constructor(credentials: ProviderCredentials) {
		super('copilot', credentials, 'gpt-4o');
		// Async init happens in ensureInitialized() before first use
	}

	private async ensureInitialized(): Promise<void> {
		if (this.initialized) return;

		let apiKey = this.credentials.apiKey;

		// Try auto-detection if no key was manually provided
		if (!apiKey || this.credentials.useOAuth) {
			const autoToken = await getCopilotToken();
			if (autoToken) {
				apiKey = autoToken;
			}
		}

		if (!apiKey) {
			throw new Error(
				'Copilot provider: no API key found. Set an API key in settings or install GitHub Copilot / GitHub CLI so a token can be auto-detected.',
			);
		}

		const config: ConstructorParameters<typeof OpenAI>[0] = {apiKey};

		if (this.credentials.endpoint) {
			config.baseURL = this.credentials.endpoint;
		}

		this.client = new OpenAI(config);
		this.initialized = true;
	}

	async enhance(prompt: string, options?: EnhancementOptions): Promise<string> {
		await this.ensureInitialized();
		const systemPrompt =
			options?.systemPrompt ||
			'You are an expert at enhancing and improving user prompts for LLMs. Analyze the given prompt and return an improved version that is clearer, more specific, and more likely to produce better results. Return ONLY the enhanced prompt, no explanations.';

		const response = await this.client.chat.completions.create({
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
		});

		const content = response.choices[0]?.message?.content;

		if (!content) {
			throw new Error('No response received from Copilot');
		}

		return content.trim();
	}

	async *enhanceStream(
		prompt: string,
		options?: EnhancementOptions,
	): AsyncGenerator<string, void, unknown> {
		await this.ensureInitialized();
		const systemPrompt =
			options?.systemPrompt ||
			'You are an expert at enhancing and improving user prompts for LLMs. Analyze the given prompt and return an improved version that is clearer, more specific, and more likely to produce better results. Return ONLY the enhanced prompt, no explanations.';

		const stream = await this.client.chat.completions.create({
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
		});

		for await (const event of stream) {
			const content = event.choices[0]?.delta?.content;
			if (content) {
				yield content;
			}
		}
	}

	async getAvailableModels(): Promise<string[]> {
		return ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'claude-sonnet-4', 'o3'];
	}

	async validateCredentials(): Promise<boolean> {
		try {
			await this.ensureInitialized();
			await this.client.chat.completions.create({
				messages: [
					{
						role: 'user',
						content: 'test',
					},
				],
				model: this.defaultModel,
				max_tokens: 1,
			});
			return true;
		} catch {
			return false;
		}
	}
}
