// import React from 'react';
import {Text, Box} from 'ink';

export default function Help() {
	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>Usage</Text>
			<Text> $ prompt-enhancer --prompt "Your prompt"</Text>
			<Text />
			<Text />
			<Text bold>Examples</Text>
			<Text> $ prompt-enhancer --prompt="Build a Cli to enhance prompts"</Text>
			<Text />
			<Text>
				{' '}
				Enhanced Prompt: "Build a powerful CLI tool that enhances and optimizes
				prompts for better performance and results."
			</Text>
		</Box>
	);
}
