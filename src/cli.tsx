#!/usr/bin/env node
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import Help from './commands/help.js';
import hasFlag from 'has-flag';
import About from './commands/about.js';
import DirectEnhance from './commands/direct-enhance.js';

// Handle Ctrl+C globally to exit from any screen
process.on('SIGINT', () => {
	process.exit(0);
});

const cli = meow(
	`
	Usage
	  $ prompt-enhancer

	Options
		--prompt,-p  Your prompt to enhance

	Examples
	  $ prompt-enhancer
	  $ prompt-enhancer --prompt="Your prompt here"
	  $ prompt-enhancer -p "Your prompt here"
`,
	{
		importMeta: import.meta,
		flags: {
			prompt: {
				type: 'string',
				shortFlag: 'p',
			},
		},
	},
);

if (cli.input[0] === 'help' || hasFlag('--help')) {
	render(<Help />);
} else if (cli.flags.prompt) {
	// Direct enhancement mode when --prompt/-p flag is provided
	render(<DirectEnhance prompt={cli.flags.prompt} />);
} else {
	// Interactive TUI mode (default)
	render(<App prompt="" />);
}

if (hasFlag('--debug')) {
	console.log('Debug flags:', cli.flags);
}

if (hasFlag('--version')) {
	await import('./commands/version.js');
}

if (hasFlag('--about')) {
	render(<About />);
}
