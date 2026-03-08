import {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from './select-input.js';
import {ConfigManager} from '../lib/config/manager.js';
import {HistoryManager} from '../lib/history/manager.js';
import {EnhancementEngine} from '../lib/enhancement/engine.js';
import type {ProviderType} from '../lib/providers/index.js';
import {writeToClipboard, readFromClipboard} from '../lib/utils/clipboard.js';

interface EnhancePromptProps {
	onBack: () => void;
	fromClipboard?: boolean;
}

type State =
	| 'input'
	| 'clipboard-loading'
	| 'clipboard-preview'
	| 'enhancing'
	| 'complete'
	| 'preset-select'
	| 'error';
type CompleteAction = 'copy' | 'enhance-further' | 'main-menu';
type ErrorAction = 'retry' | 'main-menu';
type PresetId = 'concise' | 'detailed' | 'structured' | 'coding';

const PROVIDERS: ProviderType[] = ['gemini', 'copilot', 'kilo', 'opencode'];

const DEFAULT_SYSTEM_PROMPT =
	'You are an expert at enhancing and improving user prompts for LLMs. Analyze the given prompt and return an improved version that is clearer, more specific, and more likely to produce better results. Return ONLY the enhanced prompt, no explanations.';

const PRESETS: Record<PresetId, {label: string; instruction: string}> = {
	concise: {
		label: 'Make concise',
		instruction:
			'Prioritize brevity and remove unnecessary detail while preserving all critical intent.',
	},
	detailed: {
		label: 'Make more detailed',
		instruction:
			'Expand the prompt with richer context, constraints, and expected outcomes.',
	},
	structured: {
		label: 'Add structure + output format',
		instruction:
			'Restructure the prompt with clear sections and explicit output format instructions.',
	},
	coding: {
		label: 'Improve for coding tasks',
		instruction:
			'Optimize for software engineering tasks with explicit technical constraints, edge cases, and validation expectations.',
	},
};

function isProviderType(value: string): value is ProviderType {
	return PROVIDERS.includes(value as ProviderType);
}

function createPresetSystemPrompt(presetId: PresetId): string {
	const preset = PRESETS[presetId];
	return `${DEFAULT_SYSTEM_PROMPT}\n\nAdditional enhancement direction:\n${preset.instruction}\n\nKeep your response as ONLY the improved prompt text.`;
}

export default function EnhancePrompt({
	onBack,
	fromClipboard,
}: EnhancePromptProps) {
	const [state, setState] = useState<State>(
		fromClipboard ? 'clipboard-loading' : 'input',
	);
	const [prompt, setPrompt] = useState('');
	const [sourcePrompt, setSourcePrompt] = useState('');
	const [enhancedText, setEnhancedText] = useState('');
	const [statusMessage, setStatusMessage] = useState('');
	const [error, setError] = useState('');
	const [defaultProvider, setDefaultProvider] = useState<ProviderType>('kilo');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const configManager = new ConfigManager();
				await configManager.load();
				const cfg = configManager.getConfig();
				setDefaultProvider(
					cfg.defaultProvider && isProviderType(cfg.defaultProvider)
						? cfg.defaultProvider
						: 'kilo',
				);
				setLoading(false);
			} catch (_err) {
				setError('Failed to load configuration');
				setState('error');
				setLoading(false);
			}
		})();
	}, []);

	// Read clipboard when launched via "Enhance from clipboard" menu option
	useEffect(() => {
		if (!fromClipboard) return;
		(async () => {
			const result = await readFromClipboard();
			if (result.success && result.text) {
				setPrompt(result.text);
				setState('clipboard-preview');
			} else {
				setError(result.message);
				setState('error');
			}
		})();
	}, [fromClipboard]);

	// Ctrl+V: paste full clipboard content into the prompt input
	useInput(
		(_input, key) => {
			if (key.ctrl && _input === 'v') {
				void (async () => {
					const result = await readFromClipboard();
					if (result.success && result.text) {
						setPrompt(result.text);
						setStatusMessage('📋 Pasted from clipboard');
					} else {
						setStatusMessage(`Paste failed: ${result.message}`);
					}
				})();
			}
		},
		{isActive: state === 'input'},
	);

	// clipboard-preview: Enter to enhance, Esc to cancel
	useInput(
		(_input, key) => {
			if (key.return) {
				void runEnhancement(prompt);
			} else if (key.escape) {
				onBack();
			}
		},
		{isActive: state === 'clipboard-preview'},
	);

	const handleInputComplete = () => {
		if (!prompt.trim()) {
			setError('Prompt cannot be empty');
			return;
		}
		void runEnhancement(prompt);
	};

	const runEnhancement = async (inputPrompt: string, systemPrompt?: string) => {
		setState('enhancing');
		setSourcePrompt(inputPrompt);
		setError('');
		setStatusMessage('');
		setEnhancedText('');
		try {
			const configManager = new ConfigManager();
			await configManager.load();
			const historyManager = new HistoryManager();
			await historyManager.load();
			const engine = new EnhancementEngine(configManager, historyManager);

			let result = '';
			const generator = engine.enhanceStream({
				prompt: inputPrompt,
				provider: defaultProvider,
				systemPrompt,
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

			setPrompt(result);
			setState('complete');
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setState('error');
		}
	};

	const handleCompleteActionSelect = (action: CompleteAction) => {
		if (action === 'copy') {
			void (async () => {
				const result = await writeToClipboard(enhancedText);
				setStatusMessage(
					result.success
						? '✓ Enhanced prompt copied to clipboard.'
						: `Copy failed: ${result.message}`,
				);
			})();
			return;
		}

		if (action === 'enhance-further') {
			setStatusMessage('');
			setState('preset-select');
			return;
		}

		onBack();
	};

	const handlePresetSelect = (presetId: PresetId | 'back') => {
		if (presetId === 'back') {
			setState('complete');
			return;
		}

		void runEnhancement(enhancedText, createPresetSystemPrompt(presetId));
	};

	const handleErrorActionSelect = (action: ErrorAction) => {
		if (action === 'retry') {
			const retryPrompt = sourcePrompt || prompt;
			if (!retryPrompt.trim()) {
				setError(
					'No prompt is available to retry. Return to the main menu and start a new enhancement.',
				);
				return;
			}

			void runEnhancement(retryPrompt);
			return;
		}

		onBack();
	};

	if (loading) {
		return (
			<Box paddingX={2}>
				<Text color="yellow">Loading configuration...</Text>
			</Box>
		);
	}

	if (state === 'clipboard-loading') {
		return (
			<Box paddingX={2}>
				<Text color="yellow">📋 Reading clipboard...</Text>
			</Box>
		);
	}

	if (state === 'clipboard-preview') {
		const lines = prompt.split('\n');
		const previewLines = lines.slice(0, 5);
		const truncated = lines.length > 5;
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					📋 Clipboard content ({lines.length} line
					{lines.length === 1 ? '' : 's'}, {prompt.length} char
					{prompt.length === 1 ? '' : 's'}):
				</Text>
				<Box marginY={1} flexDirection="column">
					{previewLines.map((line, i) => (
						<Text key={i} color="white">
							{line || ' '}
						</Text>
					))}
					{truncated && (
						<Text color="gray">… ({lines.length - 5} more lines)</Text>
					)}
				</Box>
				<Text color="gray">[Enter] Enhance · [Esc] Cancel</Text>
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
				{statusMessage && (
					<Text color={statusMessage.startsWith('📋') ? 'green' : 'red'}>
						{statusMessage}
					</Text>
				)}
				{error && <Text color="red">Error: {error}</Text>}
				<Text color="gray">Tip: Press Ctrl+V to paste from clipboard</Text>
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
				<Text color="gray">Streaming response...</Text>
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
				<Text bold>Source prompt:</Text>
				<Text>{sourcePrompt}</Text>
				<Text />
				<Text bold>Enhanced:</Text>
				<Text>{enhancedText}</Text>
				<Text />
				{statusMessage && (
					<Text color={statusMessage.startsWith('✓') ? 'green' : 'red'}>
						{statusMessage}
					</Text>
				)}
				<Box marginY={1}>
					<SelectInput<CompleteAction>
						items={[
							{label: 'Copy enhanced prompt to clipboard', value: 'copy'},
							{label: 'Enhance further', value: 'enhance-further'},
							{label: 'Return to main menu', value: 'main-menu'},
						]}
						onSelect={item => handleCompleteActionSelect(item.value)}
						initialIndex={0}
					/>
				</Box>
			</Box>
		);
	}

	if (state === 'preset-select') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Enhance further
				</Text>
				<Text color="gray">Select how to refine the enhanced prompt:</Text>
				<Box marginY={1}>
					<SelectInput<PresetId | 'back'>
						items={[
							{label: PRESETS.concise.label, value: 'concise'},
							{label: PRESETS.detailed.label, value: 'detailed'},
							{label: PRESETS.structured.label, value: 'structured'},
							{label: PRESETS.coding.label, value: 'coding'},
							{label: 'Back to actions', value: 'back'},
						]}
						onSelect={item => handlePresetSelect(item.value)}
						initialIndex={0}
					/>
				</Box>
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
				<Box marginY={1}>
					<SelectInput<ErrorAction>
						items={[
							{label: 'Retry enhancement', value: 'retry'},
							{label: 'Return to main menu', value: 'main-menu'},
						]}
						onSelect={item => handleErrorActionSelect(item.value)}
						initialIndex={0}
					/>
				</Box>
			</Box>
		);
	}

	return null;
}
