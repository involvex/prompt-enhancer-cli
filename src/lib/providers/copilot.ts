/**
 * GitHub Copilot provider implementation
 * Uses OpenAI API (compatible with Copilot)
 */

import {OpenAI} from 'openai';
import {Provider} from './base.js';
import type {EnhancementOptions, ProviderCredentials} from '../types/index.js';

export class CopilotProvider extends Provider {
	private client: OpenAI;

	constructor(credentials: ProviderCredentials) {
		super('copilot', credentials, 'gpt-4o');

		if (!credentials.apiKey) {
			throw new Error('Copilot provider requires an API key');
		}

		const config: ConstructorParameters<typeof OpenAI>[0] = {
			apiKey: credentials.apiKey,
		};

		if (credentials.endpoint) {
			config.baseURL = credentials.endpoint;
		}

		this.client = new OpenAI(config);
	}

	async enhance(prompt: string, options?: EnhancementOptions): Promise<string> {
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
		// Azure OpenAI models available for Copilot
		return ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
	}

	async validateCredentials(): Promise<boolean> {
		try {
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
