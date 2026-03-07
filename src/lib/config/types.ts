/**
 * Configuration types for prompt-enhancer
 */

export interface ProviderConfig {
	name: string; // 'gemini' | 'copilot' | 'kilo'
	apiKey?: string;
	endpoint?: string; // for kilo or custom endpoints
	enabled: boolean;
}

export interface AppConfig {
	version: string;
	defaultProvider: string; // which provider to use by default
	defaultModel?: string;
	streaming: boolean; // enable streaming output
	saveHistory: boolean; // save enhanced prompts to history
	providers: Record<string, ProviderConfig>;
	theme?: 'dark' | 'light'; // TUI theme preference
	temperature?: number; // 0-2, controls creativity
	maxTokens?: number; // max tokens in enhancement response
}

export interface HistoryEntry {
	id: string;
	timestamp: number; // unix timestamp in ms
	originalPrompt: string;
	enhancedPrompt: string;
	provider: string;
	model: string;
	temperature?: number;
	tokens?: number;
}

export interface HistoryData {
	entries: HistoryEntry[];
	version: string;
}
