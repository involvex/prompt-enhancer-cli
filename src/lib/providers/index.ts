/**
 * Provider factory and registry
 * Manages creation and registration of provider instances
 */

import {Provider} from './base.js';
import {GeminiProvider} from './gemini.js';
import {CopilotProvider} from './copilot.js';
import {KiloProvider} from './kilo.js';
import type {ProviderCredentials} from '../types/index.js';

export type ProviderType = 'gemini' | 'copilot' | 'kilo';

class ProviderRegistry {
	private providers: Map<string, Provider> = new Map();

	register(name: string, provider: Provider): void {
		this.providers.set(name.toLowerCase(), provider);
	}

	get(name: string): Provider | undefined {
		return this.providers.get(name.toLowerCase());
	}

	getAll(): Provider[] {
		return Array.from(this.providers.values());
	}

	has(name: string): boolean {
		return this.providers.has(name.toLowerCase());
	}

	list(): string[] {
		return Array.from(this.providers.keys());
	}

	clear(): void {
		this.providers.clear();
	}
}

export class ProviderFactory {
	private registry: ProviderRegistry = new ProviderRegistry();

	createProvider(
		type: ProviderType,
		credentials: ProviderCredentials,
	): Provider {
		const lowerType = type.toLowerCase() as ProviderType;

		switch (lowerType) {
			case 'gemini': {
				return new GeminiProvider(credentials);
			}

			case 'copilot': {
				return new CopilotProvider(credentials);
			}

			case 'kilo': {
				return new KiloProvider(credentials);
			}

			default: {
				throw new Error(`Unknown provider type: ${type}`);
			}
		}
	}

	registerProvider(name: string, provider: Provider): void {
		this.registry.register(name, provider);
	}

	getProvider(name: string): Provider | undefined {
		return this.registry.get(name);
	}

	getAllProviders(): Provider[] {
		return this.registry.getAll();
	}

	hasProvider(name: string): boolean {
		return this.registry.has(name);
	}

	listProviders(): string[] {
		return this.registry.list();
	}

	clearProviders(): void {
		this.registry.clear();
	}
}

// Export singleton instance
export const providerFactory = new ProviderFactory();

/**
 * Get or create a provider by type with credentials
 */
export function getProvider(
	type: ProviderType,
	credentials?: ProviderCredentials,
): Provider {
	// If no credentials provided, create with empty credentials
	const creds = credentials || {apiKey: ''};
	return providerFactory.createProvider(type as ProviderType, creds);
}

/**
 * Get list of supported provider types
 */
export function getSupportedProviders(): ProviderType[] {
	return ['gemini', 'copilot', 'kilo'];
}
