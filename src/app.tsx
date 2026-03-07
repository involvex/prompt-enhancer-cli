import {useState} from 'react';
import {Box, Text} from 'ink';
import SelectInput from 'ink-select-input';
import EnhancePromptComponent from './components/enhance-prompt.js';
import SettingsComponent from './components/settings.js';
import HistoryComponent from './components/history-viewer.js';

type AppState = 'menu' | 'enhance' | 'settings' | 'history' | 'help';

interface Props {
	prompt?: string;
}

export default function App({prompt: _prompt}: Props) {
	const [state, setState] = useState<AppState>('menu');

	const menuItems = [
		{label: 'Enhance Prompt', value: 'enhance'},
		{label: 'Settings', value: 'settings'},
		{label: 'View History', value: 'history'},
		{label: 'Help', value: 'help'},
		{label: 'Exit', value: 'exit'},
	];

	const handleMenuSelect = (value: string) => {
		if (value === 'exit') {
			process.exit(0);
		}
		setState(value as AppState);
	};

	if (state === 'menu') {
		return (
			<Box flexDirection="column">
				<Box marginY={1} paddingX={2}>
					<Text bold color="green">
						🚀 Prompt Enhancer
					</Text>
				</Box>
				<Box marginY={0} paddingX={2}>
					<Text color="gray">
						Enhance your prompts with various LLM providers
					</Text>
				</Box>
				<Box marginY={1} paddingX={2}>
					<SelectInput
						items={menuItems}
						onSelect={item => handleMenuSelect(item.value)}
						initialIndex={0}
					/>
				</Box>
			</Box>
		);
	}

	if (state === 'enhance') {
		return <EnhancePromptComponent onBack={() => setState('menu')} />;
	}

	if (state === 'settings') {
		return <SettingsComponent onBack={() => setState('menu')} />;
	}

	if (state === 'history') {
		return <HistoryComponent onBack={() => setState('menu')} />;
	}

	if (state === 'help') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Help
				</Text>
				<Text>
					Prompt Enhancer is a CLI/TUI tool to enhance prompts using various LLM
					providers.
				</Text>
				<Text />
				<Text bold>Usage:</Text>
				<Text>Interactive mode (TUI): prompt-enhancer</Text>
				<Text>CLI mode: prompt-enhancer -p "your prompt"</Text>
				<Text>Settings: Configure API keys in the Settings menu</Text>
				<Text>History: View past enhancements in the History menu</Text>
				<Text />
				<Text bold>Supported Providers:</Text>
				<Text>- Gemini (requires API key)</Text>
				<Text>- Copilot (requires API key)</Text>
				<Text>- Kilo (free tier available)</Text>
				<Text />
				<Text bold>Features:</Text>
				<Text>- Real-time streaming output</Text>
				<Text>- Persistent configuration (~/.prompt-enhancer/config.json)</Text>
				<Text>- Enhancement history (~/.prompt-enhancer/history.json)</Text>
				<Text>- Support for multiple providers</Text>
				<Text />
				<Text color="gray">(Press Ctrl+C to return to menu)</Text>
			</Box>
		);
	}

	return null;
}
