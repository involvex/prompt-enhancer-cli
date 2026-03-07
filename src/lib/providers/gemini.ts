/**
 * Google Gemini provider implementation
 */

import {GoogleGenerativeAI} from '@google/generative-ai';
import {Provider} from './base.js';
import type {EnhancementOptions, ProviderCredentials} from '../types/index.js';
import {debugLog, logWithLevel} from '../utils/runtime-logging.js';

export class GeminiProvider extends Provider {
	private client: GoogleGenerativeAI;

	constructor(credentials: ProviderCredentials) {
		super('gemini', credentials, 'gemini-2.5-flash');

		if (!credentials.apiKey) {
			throw new Error('Gemini provider requires an API key');
		}

		this.client = new GoogleGenerativeAI(credentials.apiKey);
	}

	async enhance(prompt: string, options?: EnhancementOptions): Promise<string> {
		const model = this.client.getGenerativeModel({
			model: options?.model || this.defaultModel,
		});

		const systemPrompt =
			options?.systemPrompt ||
			'You are an expert at enhancing and improving user prompts for LLMs. Analyze the given prompt and return an improved version that is clearer, more specific, and more likely to produce better results. Return ONLY the enhanced prompt, no explanations.';
		const payload = {
			contents: [
				{
					role: 'user',
					parts: [
						{
							text: `${systemPrompt}\n\nOriginal prompt:\n${prompt}`,
						},
					],
				},
			],
		};
		debugLog('Gemini API request payload', {
			model: options?.model || this.defaultModel,
			temperature: options?.temperature,
			maxTokens: options?.maxTokens,
			payload,
		});

		const result = await model.generateContent(payload);

		const response = result.response;
		debugLog('Gemini API response metadata', {
			candidates: response.candidates?.length ?? 0,
			usageMetadata: response.usageMetadata ?? null,
		});
		const text = response.text();

		if (!text) {
			throw new Error('No response received from Gemini');
		}

		return text.trim();
	}

	async *enhanceStream(
		prompt: string,
		options?: EnhancementOptions,
	): AsyncGenerator<string, void, unknown> {
		const model = this.client.getGenerativeModel({
			model: options?.model || this.defaultModel,
		});

		const systemPrompt =
			options?.systemPrompt ||
			'You are an expert at enhancing and improving user prompts for LLMs. Analyze the given prompt and return an improved version that is clearer, more specific, and more likely to produce better results. Return ONLY the enhanced prompt, no explanations.';
		const streamPayload = {
			contents: [
				{
					role: 'user',
					parts: [
						{
							text: `${systemPrompt}\n\nOriginal prompt:\n${prompt}`,
						},
					],
				},
			],
		};
		debugLog('Gemini stream request payload', {
			model: options?.model || this.defaultModel,
			streamPayload,
		});

		const result = await model.generateContentStream(streamPayload);

		let chunkCount = 0;
		for await (const chunk of result.stream) {
			chunkCount++;
			const text = chunk.text();
			if (text) {
				logWithLevel(3, `Gemini stream chunk #${chunkCount}`, {
					length: text.length,
				});
				yield text;
			}
		}
	}

	async getAvailableModels(): Promise<string[]> {
		// Gemini models available as of 2025
		return [
			'gemini-2.5-flash',
			'gemini-2.0-flash',
			'gemini-1.5-pro',
			'gemini-1.5-flash',
		];
	}

	async validateCredentials(): Promise<boolean> {
		try {
			const model = this.client.getGenerativeModel({
				model: this.defaultModel,
			});

			await model.countTokens('test prompt');
			return true;
		} catch {
			return false;
		}
	}
}
