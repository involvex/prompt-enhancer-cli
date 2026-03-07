#!/usr/bin/env node
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import Help from './commands/help.js';
import About from './commands/about.js';
import DirectEnhance from './commands/direct-enhance.js';
import DisplayVersion from './commands/version.js';
import {
	configureRuntimeLogging,
	normalizeVerboseLevel,
	writeRuntimeBanner,
} from './lib/utils/runtime-logging.js';
import type {OutputFormat} from './lib/utils/output-writer.js';

// Handle Ctrl+C globally to exit from any screen
process.on('SIGINT', () => {
	process.exit(0);
});

const cli = meow(
	`
Run "prompt-enhancer --help" for comprehensive usage.
`,
	{
		importMeta: import.meta,
		autoHelp: false,
		autoVersion: false,
		flags: {
			prompt: {
				type: 'string',
				shortFlag: 'p',
			},
			help: {
				type: 'boolean',
				default: false,
				shortFlag: 'h',
			},
			version: {
				type: 'boolean',
				default: false,
				shortFlag: 'v',
			},
			about: {
				type: 'boolean',
				default: false,
			},
			debug: {
				type: 'boolean',
				default: false,
			},
			trace: {
				type: 'boolean',
				default: false,
			},
			verbose: {
				type: 'number',
				default: 1,
			},
			output: {
				type: 'string',
				shortFlag: 'o',
			},
			outputFormat: {
				type: 'string',
				default: 'auto',
			},
		},
	},
);

if (
	!Number.isInteger(cli.flags.verbose) ||
	cli.flags.verbose < 1 ||
	cli.flags.verbose > 3
) {
	console.error(
		`Invalid --verbose value "${cli.flags.verbose}". Use integer values: 1, 2, or 3.`,
	);
	process.exit(1);
}

if (
	!['auto', 'txt', 'json', 'md'].includes(cli.flags.outputFormat.toLowerCase())
) {
	console.error(
		`Invalid --output-format "${cli.flags.outputFormat}". Supported formats: auto, txt, json, md.`,
	);
	process.exit(1);
}

const subcommand = cli.input[0]?.toLowerCase();
const normalizedVerbose = normalizeVerboseLevel(cli.flags.verbose);
const effectiveVerbose = cli.flags.trace
	? 3
	: cli.flags.debug
		? Math.max(2, normalizedVerbose)
		: normalizedVerbose;

configureRuntimeLogging({
	debug: cli.flags.debug,
	trace: cli.flags.trace,
	verbose: effectiveVerbose as 1 | 2 | 3,
});

if (cli.flags.debug || cli.flags.trace || effectiveVerbose > 1) {
	writeRuntimeBanner('prompt-enhancer');
}

if (subcommand === 'help' || cli.flags.help) {
	render(<Help />);
} else if (subcommand === 'version' || cli.flags.version) {
	render(<DisplayVersion />);
} else if (subcommand === 'about' || cli.flags.about) {
	render(<About />);
} else if (
	cli.flags.prompt ||
	subcommand === 'enhance' ||
	(subcommand === 'headless' && cli.input.length > 1)
) {
	const promptFromSubcommand =
		subcommand === 'enhance' || subcommand === 'headless'
			? cli.input.slice(1).join(' ').trim()
			: '';
	const prompt = cli.flags.prompt || promptFromSubcommand;

	if (!prompt) {
		console.error(
			'Headless mode requires a prompt. Use --prompt "..." or `prompt-enhancer enhance "..."`.',
		);
		process.exit(1);
	}

	// Direct enhancement mode when --prompt/-p flag is provided
	render(
		<DirectEnhance
			prompt={prompt}
			debug={cli.flags.debug}
			trace={cli.flags.trace}
			verbose={effectiveVerbose as 1 | 2 | 3}
			outputPath={cli.flags.output}
			outputFormat={
				cli.flags.outputFormat.toLowerCase() as OutputFormat | 'auto'
			}
		/>,
	);
} else {
	// Interactive TUI mode (default)
	render(<App prompt="" />);
}
