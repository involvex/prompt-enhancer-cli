import {Text, Box} from 'ink';

export default function Help() {
	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				Prompt Enhancer — Comprehensive Help
			</Text>
			<Text>Enhance prompts in interactive TUI mode or headless CLI mode.</Text>
			<Text />
			<Text bold>Usage</Text>
			<Text> prompt-enhancer</Text>
			<Text> prompt-enhancer --prompt "Your prompt text"</Text>
			<Text> prompt-enhancer enhance "Your prompt text"</Text>
			<Text />
			<Text bold>Subcommands</Text>
			<Text> help Show this help output</Text>
			<Text> about Show package and repository information</Text>
			<Text> version Show CLI name, description, and version</Text>
			<Text> enhance Run headless enhancement from positional text</Text>
			<Text />
			<Text bold>Options (headless and global)</Text>
			<Text>
				{' '}
				-p, --prompt &lt;text&gt; Prompt to enhance (headless mode) [default:
				undefined]
			</Text>
			<Text>
				{' '}
				-o, --output &lt;path&gt; Write enhancement output to file [default:
				undefined]
			</Text>
			<Text>
				{' '}
				--output-format &lt;fmt&gt; Output file format: auto|txt|json|md
				[default: auto]
			</Text>
			<Text>
				{' '}
				--verbose &lt;level&gt; Output verbosity level 1-3 [default: 1]
			</Text>
			<Text>
				{' '}
				--debug Enable debug diagnostics, API payload logs, and detailed error
				details [default: false]
			</Text>
			<Text> --trace Enable step-by-step execution trace [default: false]</Text>
			<Text> --about Show package metadata [default: false]</Text>
			<Text> -v, --version Show version info [default: false]</Text>
			<Text> --help Show this help output [default: false]</Text>
			<Text />
			<Text bold>Verbose Levels</Text>
			<Text> 1 Minimal runtime information (default)</Text>
			<Text> 2 Lifecycle progress and major checkpoints</Text>
			<Text> 3 Chunk-level streaming diagnostics and deep detail</Text>
			<Text />
			<Text bold>Debug and Trace Behavior</Text>
			<Text>
				{' '}
				--debug automatically enables debug diagnostics and raw provider
				request/response payload logging.
			</Text>
			<Text>
				{' '}
				--trace enables step-by-step execution logs and implies highest runtime
				detail during execution.
			</Text>
			<Text />
			<Text bold>Common Workflows</Text>
			<Text> Interactive mode (menu):</Text>
			<Text> prompt-enhancer</Text>
			<Text> Basic headless run:</Text>
			<Text> prompt-enhancer --prompt "Write a better API README"</Text>
			<Text> Save output as JSON:</Text>
			<Text>
				{' '}
				prompt-enhancer -p "Improve this prompt" -o .\output\result.json
				--output-format json
			</Text>
			<Text> Full diagnostics with tracing:</Text>
			<Text>
				{' '}
				prompt-enhancer enhance "Create a test plan" --debug --trace --verbose 3
			</Text>
			<Text> Markdown output (format inferred from extension):</Text>
			<Text>
				{' '}
				prompt-enhancer -p "Draft a deployment checklist" -o .\out\checklist.md
			</Text>
			<Text />
			<Text bold>Troubleshooting</Text>
			<Text>
				{' '}
				- Empty enhancement output: try a different model/provider or rerun with
				--debug.
			</Text>
			<Text>
				{' '}
				- API/auth failures: verify provider keys in Settings (interactive mode)
				or config file.
			</Text>
			<Text>
				{' '}
				- Output write failures: ensure target directory is writable and format
				is valid.
			</Text>
			<Text>
				{' '}
				- Verbose level errors: use only --verbose 1, --verbose 2, or --verbose
				3.
			</Text>
			<Text />
			<Text color="gray">
				Tip: use interactive mode for iterative prompt refinement and provider
				configuration.
			</Text>
		</Box>
	);
}
