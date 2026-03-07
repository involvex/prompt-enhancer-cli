/**
 * Abstract base class for all LLM providers
 * Defines the interface that all provider implementations must follow
 */

import type {EnhancementOptions, ProviderCredentials} from '../types/index.js';

export abstract class Provider {
	protected name: string;
	protected credentials: ProviderCredentials;
	protected defaultModel: string;

	constructor(
		name: string,
		credentials: ProviderCredentials,
		defaultModel: string,
	) {
		this.name = name;
		this.credentials = credentials;
		this.defaultModel = defaultModel;
	}

	/**
	 * Get the provider name
	 */
	getName(): string {
		return this.name;
	}

	/**
	 * Enhance a prompt using this provider
	 * @param prompt The prompt to enhance
	 * @param options Enhancement options (model, temperature, etc.)
	 * @returns The enhanced prompt as a string
	 */
	abstract enhance(
		prompt: string,
		options?: EnhancementOptions,
	): Promise<string>;

	/**
	 * Enhance a prompt with streaming output
	 * @param prompt The prompt to enhance
	 * @param options Enhancement options
	 * @returns AsyncGenerator that yields string chunks as they arrive
	 */
	abstract enhanceStream(
		prompt: string,
		options?: EnhancementOptions,
	): AsyncGenerator<string, void, unknown>;

	/**
	 * Get available models for this provider
	 * @returns Array of available model IDs
	 */
	abstract getAvailableModels(): Promise<string[]>;

	/**
	 * Validate that the provider has valid credentials
	 * @returns true if credentials are valid, false otherwise
	 */
	abstract validateCredentials(): Promise<boolean>;

	/**
	 * Get provider-specific metadata
	 */
	getMetadata(): {
		name: string;
		defaultModel: string;
		supportsStreaming: boolean;
	} {
		return {
			name: this.name,
			defaultModel: this.defaultModel,
			supportsStreaming: true,
		};
	}
}
