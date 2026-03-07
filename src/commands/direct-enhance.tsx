import {useEffect, useState} from 'react';
import {Text, Box} from 'ink';
import {ConfigManager} from '../lib/config/manager.js';
import {HistoryManager} from '../lib/history/manager.js';
import {EnhancementEngine} from '../lib/enhancement/engine.js';
import {
	debugLog,
	formatErrorDetails,
	logWithLevel,
	traceLog,
} from '../lib/utils/runtime-logging.js';
import {
	writeEnhancementOutputFile,
	type OutputFormat,
} from '../lib/utils/output-writer.js';

interface DirectEnhanceProps {
	prompt: string;
	debug?: boolean;
	trace?: boolean;
	verbose?: 1 | 2 | 3;
	outputPath?: string;
	outputFormat?: OutputFormat | 'auto';
}

export default function DirectEnhance({
	prompt,
	debug = false,
	trace = false,
	verbose = 1,
	outputPath,
	outputFormat = 'auto',
}: DirectEnhanceProps) {
	const [status, setStatus] = useState<
		'initializing' | 'enhancing' | 'complete' | 'error'
	>('initializing');
	const [output, setOutput] = useState('');
	const [error, setError] = useState('');
	const [outputFileMessage, setOutputFileMessage] = useState('');

	useEffect(() => {
		(async () => {
			const startedAt = Date.now();
			let providerName = 'unknown';
			let modelName = 'default';

			try {
				traceLog('Starting headless enhancement run', {
					trace,
					debug,
					verbose,
					outputPath: outputPath ?? null,
					outputFormat,
				});

				// Initialize managers
				traceLog('Initializing configuration manager');
				const configManager = new ConfigManager();
				await configManager.load(); // Load config from file

				const config = configManager.getConfig();
				providerName = config.defaultProvider;
				modelName = config.defaultModel ?? 'default';

				logWithLevel(2, 'Loaded configuration for headless mode', {
					defaultProvider: providerName,
					defaultModel: modelName,
					saveHistory: config.saveHistory,
				});

				traceLog('Initializing history manager');
				const historyManager = new HistoryManager();
				await historyManager.load(); // Load history from file

				traceLog('Initializing enhancement engine');
				const engine = new EnhancementEngine(configManager, historyManager);

				setStatus('enhancing');
				logWithLevel(1, 'Enhancement request started.');

				// Stream enhancement
				let result = '';
				let chunkCount = 0;
				const generator = engine.enhanceStream({
					prompt,
					saveToHistory: true,
				});

				for await (const chunk of generator) {
					chunkCount++;
					result += chunk;
					setOutput(result);
					if (verbose >= 3) {
						logWithLevel(3, `Received stream chunk #${chunkCount}`, {
							chunkLength: chunk.length,
							totalLength: result.length,
						});
					}
				}

				if (!result.trim()) {
					throw new Error(
						'Enhancement returned an empty result — the model may be rate-limited or temporarily unavailable.',
					);
				}

				logWithLevel(1, 'Enhancement request completed.', {
					durationMs: Date.now() - startedAt,
					outputLength: result.length,
					chunkCount,
				});

				if (outputPath) {
					traceLog('Writing enhancement output to file', {
						outputPath,
						outputFormat,
					});
					const outputFile = await writeEnhancementOutputFile(
						outputPath,
						{
							originalPrompt: prompt,
							enhancedPrompt: result,
							provider: providerName,
							model: modelName,
							timestamp: new Date().toISOString(),
							durationMs: Date.now() - startedAt,
						},
						outputFormat,
					);
					setOutputFileMessage(
						`Output written to ${outputFile.path} (${outputFile.format})`,
					);
					logWithLevel(2, 'Output file written successfully.', outputFile);
				}

				setStatus('complete');
			} catch (err) {
				setStatus('error');
				const errorText = formatErrorDetails(err);
				setError(errorText);
				if (debug) {
					debugLog('Headless enhancement failed with detailed error', {
						error: errorText,
						promptLength: prompt.length,
						outputPath: outputPath ?? null,
					});
				}
			}
		})();
	}, [debug, outputFormat, outputPath, prompt, trace, verbose]);

	if (status === 'error') {
		return (
			<Box flexDirection="column" marginY={1}>
				<Text color="red">Error: {error}</Text>
			</Box>
		);
	}

	if (status === 'initializing') {
		return <Text>Initializing...</Text>;
	}

	if (status === 'enhancing') {
		return (
			<Box flexDirection="column" marginY={1}>
				<Text bold color="cyan">
					Enhancing prompt...
				</Text>
				<Text>{output}</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" marginY={1}>
			<Text bold color="green">
				Enhanced prompt:
			</Text>
			<Text>{output}</Text>
			{outputFileMessage && <Text color="cyan">{outputFileMessage}</Text>}
		</Box>
	);
}
