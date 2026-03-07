import {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from './select-input.js';
import {ConfigManager} from '../lib/config/manager.js';
import type {ProviderType} from '../lib/providers/index.js';
import type {ModelEntry} from '../lib/utils/models-cache.js';
import {getModelsForProvider} from '../lib/utils/models-cache.js';
import type {AppConfig} from '../lib/config/schema.js';

interface SettingsProps {
	onBack: () => void;
}

type State =
	| 'menu'
	| 'configure-provider'
	| 'set-default-provider'
	| 'set-default-model'
	| 'success'
	| 'error';

type Step = 'useOAuth' | 'apiKey' | 'model';

function getStep(
	provider: ProviderType | '',
	stepIndex: number,
	useOAuth: boolean,
): Step {
	if (provider === 'copilot') {
		if (stepIndex === 0) return 'useOAuth';
		if (stepIndex === 1 && !useOAuth) return 'apiKey';
		return 'model';
	}
	return stepIndex === 0 ? 'apiKey' : 'model';
}

export default function Settings({onBack}: SettingsProps) {
	const [state, setState] = useState<State>('menu');
	const [selectedProvider, setSelectedProvider] = useState<ProviderType | ''>(
		'',
	);
	const [apiKey, setApiKey] = useState('');
	const [modelText, setModelText] = useState('');
	const [useOAuth, setUseOAuth] = useState(false);
	const [stepIndex, setStepIndex] = useState(0);
	const [message, setMessage] = useState('');
	const [config, setConfig] = useState<AppConfig | null>(null);
	const [models, setModels] = useState<ModelEntry[]>([]);
	const [modelsLoading, setModelsLoading] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const mgr = new ConfigManager();
				await mgr.load();
				setConfig(mgr.getConfig());
			} catch {
				setMessage('Failed to load configuration');
			}
		})();
	}, []);

	useEffect(() => {
		if (state === 'success') {
			const t = setTimeout(() => onBack(), 2000);
			return () => clearTimeout(t);
		}
		return undefined;
	}, [state, onBack]);

	const loadModels = async (provider: ProviderType, key?: string) => {
		setModelsLoading(true);
		setModels([]);
		try {
			const entries = await getModelsForProvider(provider, key);
			setModels(entries);
		} catch {
			setModels([]);
		} finally {
			setModelsLoading(false);
		}
	};

	const advanceStep = (nextUseOAuth?: boolean) => {
		const nextIndex = stepIndex + 1;
		const nextStep = getStep(
			selectedProvider,
			nextIndex,
			nextUseOAuth ?? useOAuth,
		);
		if (nextStep === 'model' && selectedProvider) {
			void loadModels(
				selectedProvider as ProviderType,
				selectedProvider === 'opencode' ? apiKey : undefined,
			);
		}
		setStepIndex(nextIndex);
	};

	const saveProvider = async (chosenModel: string) => {
		try {
			const mgr = new ConfigManager();
			await mgr.load();
			const cfg = mgr.getConfig();

			type ProviderEntry = {
				name: ProviderType;
				enabled: boolean;
				model: string;
				apiKey?: string;
				useOAuth?: boolean;
			};

			const entry: ProviderEntry = {
				name: selectedProvider as ProviderType,
				enabled: true,
				model: chosenModel,
			};

			if (selectedProvider === 'copilot') {
				entry.useOAuth = useOAuth;
				if (!useOAuth && apiKey.trim()) entry.apiKey = apiKey.trim();
			} else if (apiKey.trim()) {
				entry.apiKey = apiKey.trim();
			}

			const updated: AppConfig = {
				...cfg,
				providers: {
					...cfg.providers,
					[selectedProvider]: entry,
				} as AppConfig['providers'],
			};

			await mgr.setConfig(updated);
			setConfig(updated);
			setMessage(`✓ ${selectedProvider} configured successfully!`);
			setState('success');
		} catch (err) {
			setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
			setState('error');
		}
	};

	const saveDefaultProvider = async (provider: ProviderType) => {
		try {
			const mgr = new ConfigManager();
			await mgr.load();
			const cfg = mgr.getConfig();
			const updated = {...cfg, defaultProvider: provider};
			await mgr.setConfig(updated);
			setConfig(updated);
			setMessage(`✓ Default provider set to ${provider}`);
			setState('success');
		} catch (err) {
			setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
			setState('error');
		}
	};

	const saveDefaultModel = async (model: string) => {
		try {
			const mgr = new ConfigManager();
			await mgr.load();
			const cfg = mgr.getConfig();
			const updated = {...cfg, defaultModel: model};
			await mgr.setConfig(updated);
			setConfig(updated);
			setMessage(`✓ Default model set to ${model}`);
			setState('success');
		} catch (err) {
			setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
			setState('error');
		}
	};

	const providers: ProviderType[] = ['gemini', 'copilot', 'kilo', 'opencode'];

	const menuItems = [
		...providers.map(p => ({label: `Configure ${p}`, value: p})),
		{label: 'Set Default Provider', value: '__default-provider__'},
		{label: 'Set Default Model', value: '__default-model__'},
		{label: 'Back', value: '__back__'},
	];

	if (state === 'menu') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					⚙ Settings
				</Text>
				{config && (
					<Text color="gray">
						default: {config.defaultProvider ?? 'kilo'} /{' '}
						{config.defaultModel ?? 'minimax/minimax-m2.5'}
					</Text>
				)}
				<Box marginY={1}>
					<SelectInput
						items={menuItems}
						onSelect={item => {
							if (item.value === '__back__') {
								onBack();
							} else if (item.value === '__default-provider__') {
								setState('set-default-provider');
							} else if (item.value === '__default-model__') {
								const p = (config?.defaultProvider as ProviderType) ?? 'kilo';
								void loadModels(p);
								setState('set-default-model');
							} else {
								setSelectedProvider(item.value as ProviderType);
								setApiKey('');
								setModelText('');
								setUseOAuth(false);
								setStepIndex(0);
								setModels([]);
								setMessage('');
								setState('configure-provider');
							}
						}}
					/>
				</Box>
			</Box>
		);
	}

	if (state === 'set-default-provider') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Set Default Provider
				</Text>
				<Box marginY={1}>
					<SelectInput
						items={providers.map(p => ({label: p, value: p}))}
						onSelect={item =>
							void saveDefaultProvider(item.value as ProviderType)
						}
					/>
				</Box>
			</Box>
		);
	}

	if (state === 'set-default-model') {
		const defaultProvider = (config?.defaultProvider as ProviderType) ?? 'kilo';
		if (modelsLoading) {
			return (
				<Box paddingX={2}>
					<Text color="yellow">Loading models for {defaultProvider}…</Text>
				</Box>
			);
		}
		if (models.length === 0) {
			return (
				<Box flexDirection="column" paddingX={2}>
					<Text bold color="cyan">
						Set Default Model ({defaultProvider})
					</Text>
					<Box marginY={1}>
						<Text>Model ID: </Text>
						<TextInput
							value={modelText}
							onChange={setModelText}
							onSubmit={() => {
								if (modelText.trim()) void saveDefaultModel(modelText.trim());
							}}
							placeholder="Enter model ID…"
						/>
					</Box>
				</Box>
			);
		}
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Set Default Model ({defaultProvider})
				</Text>
				<Box marginY={1}>
					<SelectInput
						items={models.map(m => ({
							label: `${m.name}  (${m.id})`,
							value: m.id,
						}))}
						onSelect={item => void saveDefaultModel(item.value)}
					/>
				</Box>
			</Box>
		);
	}

	if (state === 'configure-provider') {
		const step = getStep(selectedProvider, stepIndex, useOAuth);

		if (step === 'useOAuth') {
			return (
				<Box flexDirection="column" paddingX={2}>
					<Text bold color="cyan">
						Configure copilot — Authentication
					</Text>
					<Box marginY={1}>
						<SelectInput
							items={[
								{
									label: 'Auto-detect token from ~/.copilot/ (recommended)',
									value: 'auto',
								},
								{label: 'Enter API key manually', value: 'manual'},
							]}
							onSelect={item => {
								const auto = item.value === 'auto';
								setUseOAuth(auto);
								advanceStep(auto);
							}}
						/>
					</Box>
				</Box>
			);
		}

		if (step === 'apiKey') {
			const isRequired =
				selectedProvider === 'gemini' || selectedProvider === 'opencode';
			const hint =
				selectedProvider === 'kilo'
					? 'Free models still need an API key — get one at https://app.kilo.ai'
					: selectedProvider === 'copilot'
						? 'Enter your GitHub Copilot API key'
						: selectedProvider === 'opencode'
							? 'Enter your OpenCode API key — get one at https://opencode.ai'
							: undefined;
			return (
				<Box flexDirection="column" paddingX={2}>
					<Text bold color="cyan">
						Configure {selectedProvider}
					</Text>
					{hint && (
						<Text color="gray" dimColor>
							{hint}
						</Text>
					)}
					<Box marginY={1}>
						<Text>API Key{isRequired ? '' : ' (optional)'}: </Text>
						<TextInput
							value={apiKey}
							onChange={setApiKey}
							onSubmit={() => {
								if (isRequired && !apiKey.trim()) {
									setMessage(`API key is required for ${selectedProvider}`);
									return;
								}
								setMessage('');
								advanceStep();
							}}
							placeholder={
								selectedProvider === 'kilo'
									? 'Skip or enter key…'
									: 'Enter API key…'
							}
							mask="*"
						/>
					</Box>
					{message && <Text color="red">{message}</Text>}
				</Box>
			);
		}

		if (step === 'model') {
			if (modelsLoading) {
				return (
					<Box paddingX={2}>
						<Text color="yellow">Loading models for {selectedProvider}…</Text>
					</Box>
				);
			}
			if (models.length === 0) {
				return (
					<Box flexDirection="column" paddingX={2}>
						<Text bold color="cyan">
							Configure {selectedProvider} — Model
						</Text>
						<Box marginY={1}>
							<Text>Model ID: </Text>
							<TextInput
								value={modelText}
								onChange={setModelText}
								onSubmit={() => {
									if (modelText.trim()) void saveProvider(modelText.trim());
								}}
								placeholder="Enter model ID…"
							/>
						</Box>
					</Box>
				);
			}
			return (
				<Box flexDirection="column" paddingX={2}>
					<Text bold color="cyan">
						Configure {selectedProvider} — Choose Model
					</Text>
					<Box marginY={1}>
						<SelectInput
							items={models.map(m => ({
								label: `${m.name}  (${m.id})`,
								value: m.id,
							}))}
							onSelect={item => void saveProvider(item.value)}
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
				<Text color="gray">(returning to menu…)</Text>
			</Box>
		);
	}

	if (state === 'error') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text color="red">{message}</Text>
				<Text />
				<Text color="gray">(Press Ctrl+C to exit)</Text>
			</Box>
		);
	}

	return null;
}
