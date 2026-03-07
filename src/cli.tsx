#!/usr/bin/env node
// import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import Help from './commands/help.js';
import hasFlag from 'has-flag';
import About from './commands/about.js';

const cli = meow(
	`
	Usage
	  $ prompt-enhancer

	Options
		--prompt,-p  Your prompt

	Examples
	  $ prompt-enhancer --prompt="Your prompt here"
	  Enhanced prompt: "Your prompt here"
`,
	{
		importMeta: import.meta,
		flags: {
			prompt: {
				type: 'string',
			},
		},
	},
);

if (cli.input[0] === 'help') {
	render(<Help />);
} else if (cli.input[0] === 'enhanceprompt') {
	render(<App prompt={cli.flags.prompt || ''} />);
} else {
	render(<App prompt={cli.flags.prompt || ''} />);
}

if (hasFlag('--debug')) {
	console.log('Debug', cli.flags);
}
if (hasFlag('--version')) {
	await import('./commands/version.js');
}
if (hasFlag('--about')) {
	render(<About />);
}
