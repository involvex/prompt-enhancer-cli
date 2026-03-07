/**
 * Utility functions for managing paths and file system operations
 */

import {homedir} from 'os';
import {join} from 'path';

export const CONFIG_DIR = join(homedir(), '.prompt-enhancer');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
export const HISTORY_FILE = join(CONFIG_DIR, 'history.json');
export const MODELS_CACHE_FILE = join(CONFIG_DIR, 'models-cache.json');

export function getConfigPath(): string {
	return CONFIG_DIR;
}

export function getConfigFilePath(): string {
	return CONFIG_FILE;
}

export function getHistoryFilePath(): string {
	return HISTORY_FILE;
}
