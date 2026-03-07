/**
 * Shared types for prompt-enhancer
 */

export interface EnhancementOptions {
	model?: string;
	temperature?: number;
	maxTokens?: number;
	systemPrompt?: string;
}

export interface EnhancementResult {
	enhanced: string;
	model: string;
	provider: string;
	tokensUsed?: number;
	duration?: number;
}

export interface StreamChunk {
	content: string;
	done: boolean;
}

export interface ProviderCredentials {
	apiKey: string;
	endpoint?: string;
	project?: string;
}
