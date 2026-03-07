// import React from 'react';
import {Text} from 'ink';
import TextInput from 'ink-text-input';
import EnhancePrompt from './commands/enhanceprompt.js';
type Props = {
	prompt: string;
};

export default function App({prompt}: Props) {
	return (
		<Text>
			Prompt: <TextInput value={prompt} onChange={EnhancePrompt} />,{' '}
			<Text color="green">{prompt}</Text>
		</Text>
	);
}
