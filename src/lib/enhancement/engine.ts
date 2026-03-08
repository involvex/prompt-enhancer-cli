/**
 * Enhancement engine - orchestrates prompt enhancement across providers
 */

import {getProvider, type ProviderType} from '../providers/index.ts';
import {HistoryManager} from '../history/manager.ts';
import {ConfigManager} from '../config/manager.ts';
import type {EnhancementOptions} from '../types/index.ts';

export interface EnhancementRequest {
	prompt: string;
	provider?: string; // override default provider
	model?: string; // override default model
	temperature?: number;
	maxTokens?: number;
	systemPrompt?: string;
	saveToHistory?: boolean;
}

export interface EnhancementResponse {
	originalPrompt: string;
	enhancedPrompt: string;
	provider: string;
	model: string;
	duration: number; // milliseconds
}

export class EnhancementEngine {
	private configManager: ConfigManager;
	private historyManager: HistoryManager;

	constructor(configManager: ConfigManager, historyManager: HistoryManager) {
		this.configManager = configManager;
		this.historyManager = historyManager;
	}

	/**
	 * Enhance a prompt using the specified (or default) provider
	 */
	async enhance(request: EnhancementRequest): Promise<EnhancementResponse> {
		const startTime = Date.now();
		const config = this.configManager.getConfig();

		// Determine which provider to use
		const providerName = request.provider || config.defaultProvider;
		const providerConfig = config.providers[providerName];

		if (!providerConfig?.enabled) {
			throw new Error(
				`Provider '${providerName}' is not enabled. Please configure it in settings.`,
			);
		}

		// Create credentials from config
		const credentials = {
			apiKey: providerConfig.apiKey || '',
			endpoint: providerConfig.endpoint,
		};

		const provider = getProvider(providerName as ProviderType, credentials);

		if (!provider) {
			throw new Error(
				`Provider '${providerName}' not found. Available providers: ${Object.keys(config.providers).join(', ')}`,
			);
		}

		// Create enhancement options
		const options: EnhancementOptions = {
			model: request.model || config.defaultModel,
			temperature: request.temperature ?? config.temperature,
			maxTokens: request.maxTokens ?? config.maxTokens,
			systemPrompt: request.systemPrompt,
		};

		// Enhance the prompt
		let enhanced: string;
		try {
			enhanced = await provider.enhance(request.prompt, options);
		} catch (error) {
			throw new Error(
				`Enhancement failed with ${providerName}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		const duration = Date.now() - startTime;

		// Save to history if requested
		if (request.saveToHistory !== false && config.saveHistory) {
			await this.historyManager.addEntry({
				originalPrompt: request.prompt,
				enhancedPrompt: enhanced,
				provider: providerName,
				model: options.model || 'default',
				temperature: options.temperature,
				tokens: options.maxTokens,
			});
		}

		return {
			originalPrompt: request.prompt,
			enhancedPrompt: enhanced,
			provider: providerName,
			model: options.model || 'default',
			duration,
		};
	}

	/**
	 * Enhance a prompt with streaming output
	 */
	async *enhanceStream(
		request: EnhancementRequest,
	): AsyncGenerator<string, EnhancementResponse> {
		const startTime = Date.now();
		const config = this.configManager.getConfig();

		// Determine which provider to use
		const providerName = request.provider || config.defaultProvider;
		const providerConfig = config.providers[providerName];

		if (!providerConfig?.enabled) {
			throw new Error(
				`Provider '${providerName}' is not enabled. Please configure it in settings.`,
			);
		}

		// Create credentials from config
		const credentials = {
			apiKey: providerConfig.apiKey || '',
			endpoint: providerConfig.endpoint,
		};

		const provider = getProvider(providerName as ProviderType, credentials);

		if (!provider) {
			throw new Error(
				`Provider '${providerName}' not found. Available providers: ${Object.keys(config.providers).join(', ')}`,
			);
		}

		// Create enhancement options
		const options: EnhancementOptions = {
			model: request.model || config.defaultModel,
			temperature: request.temperature ?? config.temperature,
			maxTokens: request.maxTokens ?? config.maxTokens,
			systemPrompt: request.systemPrompt,
		};

		// Stream enhancement
		let enhancedText = '';
		try {
			for await (const chunk of provider.enhanceStream(
				request.prompt,
				options,
			)) {
				enhancedText += chunk;
				yield chunk;
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			throw new Error(
				`Enhancement failed with ${providerName}: ${errorMessage}`,
			);
		}

		const duration = Date.now() - startTime;

		// Save to history if requested
		if (request.saveToHistory !== false && config.saveHistory) {
			await this.historyManager.addEntry({
				originalPrompt: request.prompt,
				enhancedPrompt: enhancedText,
				provider: providerName,
				model: options.model || 'default',
				temperature: options.temperature,
				tokens: options.maxTokens,
			});
		}

		return {
			originalPrompt: request.prompt,
			enhancedPrompt: enhancedText,
			provider: providerName,
			model: options.model || 'default',
			duration,
		};
	}

	/**
	 * Get available models for a provider
	 */
	async getAvailableModels(
		providerName?: string,
	): Promise<Record<string, string[]>> {
		const config = this.configManager.getConfig();
		const providers = providerName
			? [providerName]
			: Object.keys(config.providers);
		const result: Record<string, string[]> = {};

		for (const pName of providers) {
			const provider = getProvider(pName as ProviderType);
			if (provider) {
				try {
					result[pName] = await provider.getAvailableModels();
				} catch {
					result[pName] = []; // Return empty list on error
				}
			}
		}

		return result;
	}

	/**
	 * Validate provider credentials
	 */
	async validateProvider(providerName: string): Promise<boolean> {
		const provider = getProvider(providerName as ProviderType);
		if (!provider) {
			return false;
		}

		try {
			return await provider.validateCredentials();
		} catch {
			return false;
		}
	}
}
