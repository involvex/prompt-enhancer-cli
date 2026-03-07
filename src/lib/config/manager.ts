/**
 * Configuration manager for reading and writing app config
 */

import {readFile, writeFile, mkdir} from 'fs/promises';
import {existsSync} from 'fs';
import type {AppConfig} from './schema.js';
import {AppConfigSchema} from './schema.js';
import {CONFIG_DIR, CONFIG_FILE} from '../utils/paths.js';

import {KILO_DEFAULT_ENDPOINT, KILO_DEFAULT_MODEL} from '../providers/kilo.js';

const DEFAULT_CONFIG: AppConfig = {
	version: '1.0.0',
	defaultProvider: 'kilo',
	defaultModel: KILO_DEFAULT_MODEL,
	streaming: true,
	saveHistory: true,
	providers: {
		gemini: {
			name: 'gemini',
			enabled: false,
		},
		copilot: {
			name: 'copilot',
			enabled: false,
		},
		kilo: {
			name: 'kilo',
			enabled: true,
			endpoint: KILO_DEFAULT_ENDPOINT,
		},
	},
	temperature: 0.7,
	maxTokens: 1000,
	theme: 'dark',
};

export class ConfigManager {
	private config: AppConfig;
	private configPath: string;

	constructor(configPath?: string) {
		this.configPath = configPath || CONFIG_FILE;
		this.config = structuredClone(DEFAULT_CONFIG);
	}

	/**
	 * Load config from file, creating it if it doesn't exist
	 */
	async load(): Promise<AppConfig> {
		try {
			// Ensure config directory exists
			if (!existsSync(CONFIG_DIR)) {
				await mkdir(CONFIG_DIR, {recursive: true});
			}

			// If config file doesn't exist, create it with defaults
			if (!existsSync(this.configPath)) {
				await this.save();
				return this.config;
			}

			// Read and parse config file
			const content = await readFile(this.configPath, 'utf-8');
			const parsed = JSON.parse(content);

			// Validate using schema
			const validated = AppConfigSchema.parse(parsed);
			this.config = validated;
			return this.config;
		} catch (error) {
			console.error('Failed to load config:', error);
			throw error;
		}
	}

	/**
	 * Save current config to file
	 */
	async save(): Promise<void> {
		try {
			// Ensure directory exists
			if (!existsSync(CONFIG_DIR)) {
				await mkdir(CONFIG_DIR, {recursive: true});
			}

			// Write config file
			await writeFile(
				this.configPath,
				JSON.stringify(this.config, null, 2),
				'utf-8',
			);
		} catch (error) {
			console.error('Failed to save config:', error);
			throw error;
		}
	}

	/**
	 * Get the current config object
	 */
	getConfig(): AppConfig {
		return this.config;
	}

	/**
	 * Set the entire config object (and save)
	 */
	async setConfig(config: AppConfig): Promise<void> {
		this.config = config;
		await this.save();
	}

	/**
	 * Update a specific setting
	 */
	setSetting<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
		this.config[key] = value;
	}

	/**
	 * Get a specific setting
	 */
	getSetting<K extends keyof AppConfig>(key: K): AppConfig[K] {
		return this.config[key];
	}

	/**
	 * Update provider config
	 */
	setProvider(
		providerName: string,
		config: Partial<AppConfig['providers'][string]>,
	): void {
		if (!this.config.providers[providerName]) {
			this.config.providers[providerName] = {
				name: providerName as 'gemini' | 'copilot' | 'kilo',
				enabled: false,
			};
		}

		this.config.providers[providerName] = {
			...this.config.providers[providerName],
			...config,
		};
	}

	/**
	 * Get provider config
	 */
	getProvider(
		providerName: string,
	): AppConfig['providers'][string] | undefined {
		return this.config.providers[providerName];
	}

	/**
	 * Get all enabled providers
	 */
	getEnabledProviders(): string[] {
		return Object.entries(this.config.providers)
			.filter(([, config]) => config.enabled)
			.map(([name]) => name);
	}

	/**
	 * Reset config to defaults
	 */
	async reset(): Promise<void> {
		this.config = structuredClone(DEFAULT_CONFIG);
		await this.save();
	}
}
