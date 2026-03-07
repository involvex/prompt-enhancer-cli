import {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import {ConfigManager} from '../lib/config/manager.js';
import type {ProviderType} from '../lib/providers/index.js';

interface SettingsProps {
	onBack: () => void;
}

type State = 'menu' | 'configure-provider' | 'success' | 'error';

export default function Settings({onBack}: SettingsProps) {
	const [state, setState] = useState<State>('menu');
	const [selectedProvider, setSelectedProvider] = useState<ProviderType | ''>(
		'',
	);
	const [apiKey, setApiKey] = useState('');
	const [model, setModel] = useState('');
	const [stepInProvider, setStepInProvider] = useState(0);
	const [message, setMessage] = useState('');
	const [_config, setConfig] = useState<Record<string, unknown> | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const configManager = new ConfigManager();
				await configManager.load();
				setConfig(configManager.getConfig());
			} catch (_err) {
				setMessage('Failed to load configuration');
			}
		})();
	}, []);

	useEffect(() => {
		if (state === 'success') {
			const timeout = setTimeout(() => {
				onBack();
			}, 2000);
			return () => clearTimeout(timeout);
		}

		return undefined;
	}, [state, onBack]);

	const providers: ProviderType[] = ['gemini', 'copilot', 'kilo'];
	const menuItems = [
		...providers.map(p => ({label: `Configure ${p}`, value: p})),
		{label: 'Back', value: 'back'},
	];

	const handleMenuSelect = (value: string) => {
		if (value === 'back') {
			onBack();
		} else {
			setSelectedProvider(value as ProviderType);
			setState('configure-provider');
			setStepInProvider(0);
			setApiKey('');
			setModel('');
		}
	};

	const saveProvider = async () => {
		if (!apiKey.trim()) {
			setMessage('API key cannot be empty');
			return;
		}

		if (!model.trim()) {
			setMessage('Model cannot be empty');
			return;
		}

		try {
			const configManager = new ConfigManager();
			await configManager.load();
			const currentConfig = configManager.getConfig();

			const providers = currentConfig.providers || {};
			providers[selectedProvider] = {
				name: selectedProvider as 'gemini' | 'copilot' | 'kilo',
				apiKey,
				model,
				enabled: true,
			};

			const updated = {...currentConfig, providers};
			await configManager.setConfig(updated);
			setMessage(`✓ ${selectedProvider} configured successfully!`);
			setState('success');
		} catch (err) {
			setMessage(
				`Error saving configuration: ${err instanceof Error ? err.message : String(err)}`,
			);
			setState('error');
		}
	};

	if (state === 'menu') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Settings
				</Text>
				<Box marginY={1}>
					<SelectInput
						items={menuItems}
						onSelect={item => handleMenuSelect(item.value)}
						initialIndex={0}
					/>
				</Box>
			</Box>
		);
	}

	if (state === 'configure-provider') {
		if (stepInProvider === 0) {
			return (
				<Box flexDirection="column" paddingX={2}>
					<Text bold color="cyan">
						Configure {selectedProvider}
					</Text>
					<Box marginY={1}>
						<Text>API Key: </Text>
						<TextInput
							value={apiKey}
							onChange={setApiKey}
							onSubmit={() => setStepInProvider(1)}
							placeholder="Enter API key..."
							mask="*"
						/>
					</Box>
				</Box>
			);
		}

		if (stepInProvider === 1) {
			const modelPlaceholder =
				selectedProvider === 'gemini'
					? 'gemini-2.5-flash'
					: selectedProvider === 'copilot'
						? 'gpt-4o'
						: 'auto';
			return (
				<Box flexDirection="column" paddingX={2}>
					<Text bold color="cyan">
						Configure {selectedProvider}
					</Text>
					<Box marginY={1}>
						<Text>Model: </Text>
						<TextInput
							value={model}
							onChange={setModel}
							onSubmit={saveProvider}
							placeholder={modelPlaceholder}
						/>
					</Box>
				</Box>
			);
		}
	}

	if (state === 'success') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text color="green">{message}</Text>
				<Text />
				<Text color="gray">(returning to menu...)</Text>
			</Box>
		);
	}

	if (state === 'error') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text color="red">{message}</Text>
				<Text />
				<Text color="gray">(Press Ctrl+C to return to menu)</Text>
			</Box>
		);
	}

	return null;
}
