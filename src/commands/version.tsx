import pkg from '../../package.json' with {type: 'json'};
import {Text, Box} from 'ink';

export default function DisplayVersion() {
	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>{pkg.description}</Text>
			<Text>
				{pkg.name} v{pkg.version}
			</Text>
		</Box>
	);
}
