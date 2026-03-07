/**
 * Fetches and caches the models list from https://models.dev/api.json
 * Cache TTL is 24 hours, stored at ~/.prompt-enhancer/models-cache.json
 */

import {readFile, writeFile} from 'fs/promises';
import {existsSync} from 'fs';
import {MODELS_CACHE_FILE} from './paths.js';
import {KILO_MODELS} from '../providers/kilo.js';

const MODELS_API_URL = 'https://models.dev/api.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface ModelEntry {
	id: string;
	name: string;
}

interface ModelsDevModel {
	id: string;
	name: string;
	family?: string;
	cost?: {input?: number; output?: number};
}

interface ModelsDevProvider {
	models?: Record<string, ModelsDevModel>;
}

interface CacheFile {
	fetchedAt: number;
	data: Record<string, ModelsDevProvider>;
}

async function loadCache(): Promise<CacheFile | null> {
	if (!existsSync(MODELS_CACHE_FILE)) return null;
	try {
		const raw = await readFile(MODELS_CACHE_FILE, 'utf-8');
		return JSON.parse(raw) as CacheFile;
	} catch {
		return null;
	}
}

async function fetchAndCache(): Promise<Record<string, ModelsDevProvider>> {
	const response = await fetch(MODELS_API_URL);
	if (!response.ok) {
		throw new Error(`models.dev fetch failed: ${response.status}`);
	}
	const data = (await response.json()) as Record<string, ModelsDevProvider>;
	const cache: CacheFile = {fetchedAt: Date.now(), data};
	try {
		await writeFile(MODELS_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
	} catch {
		// Non-fatal: cache write failure just means we refetch next time
	}
	return data;
}

async function getModelsData(): Promise<Record<string, ModelsDevProvider>> {
	const cache = await loadCache();
	if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
		return cache.data;
	}
	try {
		return await fetchAndCache();
	} catch {
		// Network failure: return cached data even if stale, or empty
		return cache?.data ?? {};
	}
}

function extractModels(
	data: Record<string, ModelsDevProvider>,
	providerKeys: string[],
): ModelEntry[] {
	for (const key of providerKeys) {
		const provider = data[key];
		if (provider?.models) {
			return Object.values(provider.models).map(m => ({
				id: m.id ?? m.name,
				name: m.name,
			}));
		}
	}
	return [];
}

/**
 * Returns model list for a given provider, using models.dev cache.
 * Falls back to a hardcoded list if network is unavailable.
 */
export async function getModelsForProvider(
	provider: 'gemini' | 'copilot' | 'kilo',
): Promise<ModelEntry[]> {
	try {
		const data = await getModelsData();

		switch (provider) {
			case 'gemini':
				return extractModels(data, ['google']);
			case 'copilot':
				return extractModels(data, ['github', 'openai']);
			case 'kilo':
				// models.dev may not have a kilo key — fall through to hardcoded list
				return KILO_MODELS;
		}
	} catch {
		// Fall through to defaults
	}

	// Hardcoded fallbacks
	if (provider === 'kilo') return KILO_MODELS;
	if (provider === 'gemini') {
		return [
			{id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash'},
			{id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro'},
			{id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash'},
			{id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro'},
		];
	}
	// copilot
	return [
		{id: 'gpt-4o', name: 'GPT-4o'},
		{id: 'gpt-4o-mini', name: 'GPT-4o mini'},
		{id: 'gpt-4.1', name: 'GPT-4.1'},
		{id: 'claude-sonnet-4', name: 'Claude Sonnet 4'},
		{id: 'o3', name: 'o3'},
	];
}
