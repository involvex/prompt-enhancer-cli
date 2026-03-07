/**
 * Zod schemas for configuration validation
 */

import {z} from 'zod';

export const ProviderConfigSchema = z.object({
	name: z.enum(['gemini', 'copilot', 'kilo', 'opencode']),
	apiKey: z.string().optional(),
	model: z.string().optional(),
	endpoint: z.string().url().optional(),
	enabled: z.boolean(),
	useOAuth: z.boolean().optional(),
});

export const AppConfigSchema = z.object({
	version: z.string(),
	defaultProvider: z.string(),
	defaultModel: z.string().optional(),
	streaming: z.boolean(),
	saveHistory: z.boolean(),
	providers: z.record(z.string(), ProviderConfigSchema),
	theme: z.enum(['dark', 'light']).optional(),
	temperature: z.number().min(0).max(2).optional(),
	maxTokens: z.number().min(1).optional(),
});

export const HistoryEntrySchema = z.object({
	id: z.string(),
	timestamp: z.number(),
	originalPrompt: z.string(),
	enhancedPrompt: z.string(),
	provider: z.string(),
	model: z.string(),
	temperature: z.number().optional(),
	tokens: z.number().optional(),
});

export const HistoryDataSchema = z.object({
	entries: z.array(HistoryEntrySchema),
	version: z.string(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;
export type HistoryData = z.infer<typeof HistoryDataSchema>;
