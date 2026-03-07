/**
 * Auto-detects Copilot / GitHub OAuth credentials from well-known filesystem paths.
 *
 * Checked in order:
 *  1. ~/.copilot/hosts.json       (Copilot CLI)
 *  2. ~/.config/github-copilot/hosts.json  (Linux/Mac VSCode extension)
 *  3. %APPDATA%\GitHub Copilot\hosts.json  (Windows VSCode extension)
 *  4. ~/.config/gh/hosts.yml      (GitHub CLI — requires `js-yaml` or manual parse)
 */

import {readFile} from 'fs/promises';
import {existsSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';

interface HostsJson {
	[host: string]: {
		oauth_token?: string;
		user?: string;
		token?: string;
	};
}

async function readJsonToken(filePath: string): Promise<string | null> {
	try {
		const raw = await readFile(filePath, 'utf-8');
		const parsed = JSON.parse(raw) as HostsJson;
		const ghEntry = parsed['github.com'] ?? parsed['api.github.com'];
		const token = ghEntry?.oauth_token ?? ghEntry?.token ?? null;
		return typeof token === 'string' && token.length > 0 ? token : null;
	} catch {
		return null;
	}
}

/** Minimal YAML-line parser — only handles `oauth_token: <value>` under a `github.com:` block. */
async function readYamlToken(filePath: string): Promise<string | null> {
	try {
		const raw = await readFile(filePath, 'utf-8');
		let inGithubBlock = false;
		for (const line of raw.split('\n')) {
			if (/^github\.com:/.test(line)) {
				inGithubBlock = true;
				continue;
			}
			if (inGithubBlock) {
				// Exit block on a new top-level key
				if (
					/^\S/.test(line) &&
					!line.startsWith(' ') &&
					!line.startsWith('\t')
				) {
					break;
				}
				const match = /oauth_token:\s*(.+)/.exec(line);
				if (match) {
					return match[1]!.trim();
				}
			}
		}
	} catch {
		// Ignore
	}
	return null;
}

/**
 * Attempts to auto-detect a GitHub/Copilot OAuth token from the local machine.
 * Returns `null` if no token can be found.
 */
export async function getCopilotToken(): Promise<string | null> {
	const home = homedir();

	const jsonPaths = [
		join(home, '.copilot', 'hosts.json'),
		join(home, '.config', 'github-copilot', 'hosts.json'),
	];

	// Windows: %APPDATA%\GitHub Copilot\hosts.json
	if (process.env['APPDATA']) {
		jsonPaths.push(
			join(process.env['APPDATA'], 'GitHub Copilot', 'hosts.json'),
		);
	}

	for (const p of jsonPaths) {
		if (existsSync(p)) {
			const token = await readJsonToken(p);
			if (token) return token;
		}
	}

	// GitHub CLI fallback: ~/.config/gh/hosts.yml
	const yamlPath = join(home, '.config', 'gh', 'hosts.yml');
	if (existsSync(yamlPath)) {
		const token = await readYamlToken(yamlPath);
		if (token) return token;
	}

	return null;
}
