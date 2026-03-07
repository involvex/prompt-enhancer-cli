import {useEffect, useState} from 'react';
import {Text, Box} from 'ink';
import {ConfigManager} from '../lib/config/manager.js';
import {HistoryManager} from '../lib/history/manager.js';
import {EnhancementEngine} from '../lib/enhancement/engine.js';

interface DirectEnhanceProps {
	prompt: string;
}

export default function DirectEnhance({prompt}: DirectEnhanceProps) {
	const [status, setStatus] = useState<
		'initializing' | 'enhancing' | 'complete' | 'error'
	>('initializing');
	const [output, setOutput] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		(async () => {
			try {
				// Initialize managers
				const configManager = new ConfigManager();
				await configManager.load(); // Load config from file
				const historyManager = new HistoryManager();
				await historyManager.load(); // Load history from file
				const engine = new EnhancementEngine(configManager, historyManager);

				setStatus('enhancing');

				// Stream enhancement
				let result = '';
				const generator = engine.enhanceStream({
					prompt,
					saveToHistory: true,
				});

				for await (const chunk of generator) {
					result += chunk;
					setOutput(result);
				}

				setStatus('complete');
			} catch (err) {
				setStatus('error');
				setError(err instanceof Error ? err.message : String(err));
			}
		})();
	}, [prompt]);

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
		</Box>
	);
}
