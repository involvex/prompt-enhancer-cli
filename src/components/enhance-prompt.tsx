import {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import {ConfigManager} from '../lib/config/manager.js';
import {HistoryManager} from '../lib/history/manager.js';
import {EnhancementEngine} from '../lib/enhancement/engine.js';
import type {ProviderType} from '../lib/providers/index.js';

interface EnhancePromptProps {
	onBack: () => void;
}

type State = 'input' | 'enhancing' | 'complete' | 'error';

export default function EnhancePrompt({onBack: _onBack}: EnhancePromptProps) {
	const [state, setState] = useState<State>('input');
	const [prompt, setPrompt] = useState('');
	const [enhancedText, setEnhancedText] = useState('');
	const [error, setError] = useState('');
	const [defaultProvider, setDefaultProvider] = useState('kilo');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const configManager = new ConfigManager();
				await configManager.load();
				const cfg = configManager.getConfig();
				setDefaultProvider(cfg.defaultProvider ?? 'kilo');
				setLoading(false);
			} catch (_err) {
				setError('Failed to load configuration');
				setLoading(false);
			}
		})();
	}, []);

	const handleInputComplete = () => {
		if (!prompt.trim()) {
			setError('Prompt cannot be empty');
			return;
		}
		setError('');
		void enhancePrompt(defaultProvider);
	};

	const enhancePrompt = async (provider: string) => {
		setState('enhancing');
		try {
			const configManager = new ConfigManager();
			await configManager.load();
			const historyManager = new HistoryManager();
			await historyManager.load();
			const engine = new EnhancementEngine(configManager, historyManager);

			let result = '';
			const generator = engine.enhanceStream({
				prompt,
				provider: provider as ProviderType,
				saveToHistory: true,
			});

			for await (const chunk of generator) {
				result += chunk;
				setEnhancedText(result);
			}

			if (!result.trim()) {
				throw new Error(
					'Enhancement returned an empty result — the model may be rate-limited or temporarily unavailable. Try a different model.',
				);
			}

			setState('complete');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setState('error');
		}
	};

	if (loading) {
		return (
			<Box paddingX={2}>
				<Text color="yellow">Loading configuration...</Text>
			</Box>
		);
	}

	if (state === 'input') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Enter prompt to enhance:
				</Text>
				<Box marginY={1}>
					<Text>Prompt: </Text>
					<TextInput
						value={prompt}
						onChange={setPrompt}
						onSubmit={handleInputComplete}
						placeholder="Type your prompt here..."
					/>
				</Box>
				{error && <Text color="red">Error: {error}</Text>}
			</Box>
		);
	}

	if (state === 'enhancing') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Enhancing with {defaultProvider}...
				</Text>
				<Box marginY={1}>
					<Text>{enhancedText}</Text>
				</Box>
			</Box>
		);
	}

	if (state === 'complete') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="green">
					✓ Enhancement complete!
				</Text>
				<Text />
				<Text bold>Original:</Text>
				<Text>{prompt}</Text>
				<Text />
				<Text bold>Enhanced:</Text>
				<Text>{enhancedText}</Text>
				<Text />
				<Text color="gray">(Press Ctrl+C to return to menu)</Text>
			</Box>
		);
	}

	if (state === 'error') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="red">
					✗ Error:
				</Text>
				<Text color="red">{error}</Text>
				<Text />
				<Text color="gray">(Press Ctrl+C to return to menu)</Text>
			</Box>
		);
	}

	return null;
}
