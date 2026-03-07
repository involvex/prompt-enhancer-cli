/**
 * History manager for persisting enhanced prompts
 */

import {readFile, writeFile, mkdir} from 'fs/promises';
import {existsSync} from 'fs';
import {randomUUID} from 'crypto';
import type {HistoryEntry, HistoryData} from '../config/schema.js';
import {HistoryDataSchema} from '../config/schema.js';
import {CONFIG_DIR, HISTORY_FILE} from '../utils/paths.js';

const DEFAULT_HISTORY: HistoryData = {
	entries: [],
	version: '1.0.0',
};

export class HistoryManager {
	private history: HistoryData;
	private historyPath: string;

	constructor(historyPath?: string) {
		this.historyPath = historyPath || HISTORY_FILE;
		this.history = structuredClone(DEFAULT_HISTORY);
	}

	/**
	 * Load history from file
	 */
	async load(): Promise<HistoryData> {
		try {
			// Ensure directory exists
			if (!existsSync(CONFIG_DIR)) {
				await mkdir(CONFIG_DIR, {recursive: true});
			}

			// If history file doesn't exist, create it with defaults
			if (!existsSync(this.historyPath)) {
				await this.save();
				return this.history;
			}

			// Read and parse history file
			const content = await readFile(this.historyPath, 'utf-8');
			const parsed = JSON.parse(content);

			// Validate using schema
			const validated = HistoryDataSchema.parse(parsed);
			this.history = validated;
			return this.history;
		} catch (error) {
			console.error('Failed to load history:', error);
			throw error;
		}
	}

	/**
	 * Save current history to file
	 */
	async save(): Promise<void> {
		try {
			// Ensure directory exists
			if (!existsSync(CONFIG_DIR)) {
				await mkdir(CONFIG_DIR, {recursive: true});
			}

			// Write history file
			await writeFile(
				this.historyPath,
				JSON.stringify(this.history, null, 2),
				'utf-8',
			);
		} catch (error) {
			console.error('Failed to save history:', error);
			throw error;
		}
	}

	/**
	 * Add an entry to history
	 */
	async addEntry(
		entry: Omit<HistoryEntry, 'id' | 'timestamp'>,
	): Promise<HistoryEntry> {
		const historyEntry: HistoryEntry = {
			...entry,
			id: randomUUID(),
			timestamp: Date.now(),
		};

		this.history.entries.push(historyEntry);
		await this.save();
		return historyEntry;
	}

	/**
	 * Get all history entries
	 */
	getEntries(): HistoryEntry[] {
		return this.history.entries;
	}

	/**
	 * Get entries by provider
	 */
	getEntriesByProvider(provider: string): HistoryEntry[] {
		return this.history.entries.filter(entry => entry.provider === provider);
	}

	/**
	 * Get recent entries (last N)
	 */
	getRecent(count: number = 10): HistoryEntry[] {
		return this.history.entries.slice(-count).reverse();
	}

	/**
	 * Clear all history
	 */
	async clear(): Promise<void> {
		this.history.entries = [];
		await this.save();
	}

	/**
	 * Delete a specific entry
	 */
	async deleteEntry(id: string): Promise<boolean> {
		const index = this.history.entries.findIndex(e => e.id === id);
		if (index !== -1) {
			this.history.entries.splice(index, 1);
			await this.save();
			return true;
		}

		return false;
	}

	/**
	 * Export history as JSON
	 */
	export(): HistoryData {
		return structuredClone(this.history);
	}
}
