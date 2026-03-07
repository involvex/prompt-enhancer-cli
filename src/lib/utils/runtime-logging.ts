import process from 'node:process';

export type VerboseLevel = 1 | 2 | 3;

export interface RuntimeLoggingOptions {
	debug: boolean;
	trace: boolean;
	verbose: VerboseLevel;
}

const runtimeLoggingOptions: RuntimeLoggingOptions = {
	debug: false,
	trace: false,
	verbose: 1,
};

function clampVerboseLevel(value: number): VerboseLevel {
	if (value <= 1) return 1;
	if (value >= 3) return 3;
	return 2;
}

export function normalizeVerboseLevel(value: number | undefined): VerboseLevel {
	if (typeof value !== 'number' || Number.isNaN(value)) {
		return 1;
	}

	return clampVerboseLevel(Math.floor(value));
}

export function configureRuntimeLogging(
	options: Partial<RuntimeLoggingOptions>,
): RuntimeLoggingOptions {
	if (typeof options.debug === 'boolean') {
		runtimeLoggingOptions.debug = options.debug;
	}

	if (typeof options.trace === 'boolean') {
		runtimeLoggingOptions.trace = options.trace;
	}

	if (typeof options.verbose === 'number') {
		runtimeLoggingOptions.verbose = normalizeVerboseLevel(options.verbose);
	}

	return {...runtimeLoggingOptions};
}

export function getRuntimeLoggingOptions(): RuntimeLoggingOptions {
	return {...runtimeLoggingOptions};
}

export function logWithLevel(
	level: number,
	message: string,
	details?: unknown,
): void {
	if (runtimeLoggingOptions.verbose < level) return;

	if (details === undefined) {
		console.error(`[verbose:${level}] ${message}`);
		return;
	}

	console.error(`[verbose:${level}] ${message}`);
	console.error(safeSerialize(details));
}

export function debugLog(message: string, details?: unknown): void {
	if (!runtimeLoggingOptions.debug) return;

	if (details === undefined) {
		console.error(`[debug] ${message}`);
		return;
	}

	console.error(`[debug] ${message}`);
	console.error(safeSerialize(details));
}

export function traceLog(step: string, details?: unknown): void {
	if (!runtimeLoggingOptions.trace) return;

	if (details === undefined) {
		console.error(`[trace] ${step}`);
		return;
	}

	console.error(`[trace] ${step}`);
	console.error(safeSerialize(details));
}

export function formatErrorDetails(error: unknown): string {
	if (error instanceof Error) {
		if (runtimeLoggingOptions.debug && error.stack) {
			return error.stack;
		}

		return error.message;
	}

	return String(error);
}

export function safeSerialize(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

export function redactAuthorizationHeaders(
	headers: Record<string, string>,
): Record<string, string> {
	const redacted = {...headers};
	for (const key of Object.keys(redacted)) {
		if (key.toLowerCase() === 'authorization') {
			redacted[key] = 'Bearer ***redacted***';
		}
	}

	return redacted;
}

export function writeRuntimeBanner(command: string): void {
	const options = getRuntimeLoggingOptions();
	console.error(
		`[runtime] ${command} | debug=${options.debug} trace=${options.trace} verbose=${options.verbose} node=${process.version}`,
	);
}
