import {Text, Box} from 'ink';
// import React from 'react';
export default function EnhancePrompt() {
	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>Usage</Text>
			<Text> $ %NAME%</Text>
			<Text />
			<Text bold>Options</Text>
			<Text> --name Your name</Text>
			<Text />
			<Text bold>Examples</Text>
			<Text> $ %NAME% --name=Jane</Text>
			<Text> Hello, Jane</Text>
		</Box>
	);
}
