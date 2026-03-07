import {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import SelectInput from 'ink-select-input';
import {HistoryManager} from '../lib/history/manager.js';
import type {HistoryEntry} from '../lib/config/schema.js';

interface HistoryProps {
	onBack: () => void;
}

type State = 'list' | 'detail' | 'empty' | 'error';

export default function HistoryViewer({onBack}: HistoryProps) {
	const [state, setState] = useState<State>('empty');
	const [entries, setEntries] = useState<HistoryEntry[]>([]);
	const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
	const [message, setMessage] = useState('');

	useEffect(() => {
		(async () => {
			try {
				const historyManager = new HistoryManager();
				await historyManager.load();
				const allEntries = historyManager.getEntries();

				if (allEntries.length === 0) {
					setState('empty');
				} else {
					setEntries(allEntries);
					setState('list');
				}
			} catch (err) {
				setMessage(err instanceof Error ? err.message : String(err));
				setState('error');
			}
		})();
	}, []);

	const handleListSelect = (index: number) => {
		if (index < entries.length) {
			const entry = entries[index];
			if (entry) {
				setSelectedEntry(entry);
				setState('detail');
			}
		} else if (index === entries.length) {
			// Back option
			onBack();
		}
	};

	if (state === 'empty') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text color="yellow">No enhancement history yet.</Text>
				<Text>Enhance a prompt to get started!</Text>
				<Text />
				<Text color="gray">(Press Ctrl+C to return to menu)</Text>
			</Box>
		);
	}

	if (state === 'error') {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text color="red">Error loading history: {message}</Text>
				<Text color="gray">(Press Ctrl+C to return to menu)</Text>
			</Box>
		);
	}

	if (state === 'list') {
		const items = entries.map((entry, idx) => ({
			label: `${new Date(entry.timestamp).toISOString().substring(0, 10)} - ${entry.provider}${
				entry.originalPrompt.length > 50
					? `: ${entry.originalPrompt.substring(0, 50)}...`
					: `: ${entry.originalPrompt}`
			}`,
			value: idx,
		}));

		items.push({label: 'Back', value: entries.length});

		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Enhancement History
				</Text>
				<Box marginY={1}>
					<SelectInput
						items={items}
						onSelect={item => handleListSelect(item.value)}
						initialIndex={0}
					/>
				</Box>
			</Box>
		);
	}

	if (state === 'detail' && selectedEntry) {
		return (
			<Box flexDirection="column" paddingX={2}>
				<Text bold color="cyan">
					Enhancement Details
				</Text>
				<Text />
				<Text bold>Date:</Text>
				<Text>{new Date(selectedEntry.timestamp).toISOString()}</Text>
				<Text />
				<Text bold>Provider:</Text>
				<Text>{selectedEntry.provider}</Text>
				<Text />
				<Text bold>Model:</Text>
				<Text>{selectedEntry.model}</Text>
				<Text />
				<Text bold>Original Prompt:</Text>
				<Text>{selectedEntry.originalPrompt}</Text>
				<Text />
				<Text bold>Enhanced Result:</Text>
				<Text>{selectedEntry.enhancedPrompt}</Text>
				<Text />
				<Box marginY={1}>
					<SelectInput
						items={[{label: 'Back to List', value: 'back'}]}
						onSelect={() => setState('list')}
						initialIndex={0}
					/>
				</Box>
			</Box>
		);
	}

	return null;
}
