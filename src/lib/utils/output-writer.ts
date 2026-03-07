import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, extname} from 'node:path';

export type OutputFormat = 'txt' | 'json' | 'md';

export interface EnhancementOutputPayload {
	originalPrompt: string;
	enhancedPrompt: string;
	provider: string;
	model: string;
	timestamp: string;
	durationMs: number;
}

function inferOutputFormat(path: string): OutputFormat {
	const extension = extname(path).toLowerCase();
	if (extension === '.json') return 'json';
	if (extension === '.md' || extension === '.markdown') return 'md';
	return 'txt';
}

function resolveOutputFormat(path: string, format?: string): OutputFormat {
	if (!format || format === 'auto') {
		return inferOutputFormat(path);
	}

	if (format === 'txt' || format === 'json' || format === 'md') {
		return format;
	}

	throw new Error(
		`Unsupported output format "${format}". Supported formats: txt, json, md, auto.`,
	);
}

function toText(payload: EnhancementOutputPayload): string {
	return `Prompt Enhancer Output
Timestamp: ${payload.timestamp}
Provider: ${payload.provider}
Model: ${payload.model}
Duration: ${payload.durationMs} ms

Original Prompt:
${payload.originalPrompt}

Enhanced Prompt:
${payload.enhancedPrompt}
`;
}

function toMarkdown(payload: EnhancementOutputPayload): string {
	return `## Prompt Enhancer Output

- **Timestamp:** ${payload.timestamp}
- **Provider:** ${payload.provider}
- **Model:** ${payload.model}
- **Duration:** ${payload.durationMs} ms

### Original Prompt

\`\`\`text
${payload.originalPrompt}
\`\`\`

### Enhanced Prompt

\`\`\`text
${payload.enhancedPrompt}
\`\`\`
`;
}

export async function writeEnhancementOutputFile(
	path: string,
	payload: EnhancementOutputPayload,
	format?: string,
): Promise<{path: string; format: OutputFormat}> {
	const outputFormat = resolveOutputFormat(path, format);

	await mkdir(dirname(path), {recursive: true});

	let content = '';
	if (outputFormat === 'json') {
		content = JSON.stringify(payload, null, 2);
	} else if (outputFormat === 'md') {
		content = toMarkdown(payload);
	} else {
		content = toText(payload);
	}

	await writeFile(path, content, 'utf8');

	return {path, format: outputFormat};
}
