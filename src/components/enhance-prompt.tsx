import {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import {ConfigManager} from '../lib/config/manager.js';
import {HistoryManager} from '../lib/history/manager.js';
import {EnhancementEngine} from '../lib/enhancement/engine.js';
import type {ProviderType} from '../lib/providers/index.js';

interface EnhancePromptProps {
	onBack: () => void;
}

type State = 'input' | 'provider-select' | 'enhancing' | 'complete' | 'error';

export default function EnhancePrompt({onBack: _onBack}: EnhancePromptProps) {
	const [state, setState] = useState<State>('input');
	const [prompt, setPrompt] = useState('');
	const [enhancedText, setEnhancedText] = useState('');
	const [error, setError] = useState('');
	const [selectedProvider, setSelectedProvider] = useState('');
	const [availableProviders, setAvailableProviders] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const configManager = new ConfigManager();
				await configManager.load();
				const enabled = configManager.getEnabledProviders();
				setAvailableProviders(enabled.length > 0 ? enabled : []);
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

		if (availableProviders.length === 0) {
			setError(
				'No providers configured. Please configure a provider in settings.',
			);
			return;
		}

		if (availableProviders.length === 1) {
			const provider = availableProviders[0];
			if (!provider) {
				setError('No valid provider selected');
				return;
			}
			setSelectedProvider(provider);
			enhancePrompt(provider);
		} else {
			setState('provider-select');
		}
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

	if (state === 'provider-select') {
		const providerItems = availableProviders.map(p => ({label: p, value: p}));
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Select provider:
				</Text>
				<Box marginY={1}>
					<SelectInput
						items={providerItems}
						onSelect={item => enhancePrompt(item.value)}
						initialIndex={0}
					/>
				</Box>
			</Box>
		);
	}

	if (state === 'enhancing') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Enhancing with {selectedProvider}...
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
