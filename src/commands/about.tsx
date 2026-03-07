import pkg from '../../package.json' with {type: 'json'};
import {Text, Box} from 'ink';

export default function About() {
	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>{pkg.description}</Text>
			<Text>Version: {pkg.version}</Text>
			<Text>Author: {pkg.author}</Text>
			<Text>License: {pkg.license}</Text>
			<Text>Homepage: {pkg.repository.url}</Text>
		</Box>
	);
}
