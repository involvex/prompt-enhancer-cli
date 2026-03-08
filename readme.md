# prompt-enhancer

> CLI/TUI tool to enhance prompts using various LLM providers (Gemini, Copilot, Kilo-gateway, Opencode Zen)

**Status**: ✅ MVP Complete - Phase 4 Interactive TUI Ready for Use

## Features

- 🎯 **Interactive TUI Mode** - Menu-driven interface for prompt enhancement
- ⚡ **CLI Mode** - Direct enhancement via command-line flags
- 🔧 **Multi-Provider Support** - Gemini, Copilot, Kilo-gateway
- 💾 **Config Management** - Persistent settings at `~/.prompt-enhancer/`
- 📜 **History Tracking** - Browse past enhancements
- 🔄 **Streaming Output** - Real-time enhanced prompt display
- 📋 **Post-Enhancement Actions** - Copy to clipboard, enhance further, or return to main menu
- 🧠 **Enhance Further Presets** - Make concise, make more detailed, add structure/output format, improve for coding tasks
- 🎨 **Interactive Settings** - Configure providers via TUI

## Install

```bash
npm install --global prompt-enhancer
```

Or use directly:

```bash
npx prompt-enhancer
```

## Quick Start

### Interactive TUI Mode (Default)

```bash
prompt-enhancer
```

This launches the interactive menu where you can:

- Enhance a prompt
- Configure provider settings
- View enhancement history
- Get help

After an enhancement completes in TUI mode, you can:

- Copy the enhanced prompt to clipboard
- Run "Enhance further" with presets
- Return to the main menu without exiting

### CLI Mode - Direct Enhancement

```bash
$ prompt-enhancer --prompt "Your prompt here"
# or shorter
$ prompt-enhancer -p "Your prompt here"
```

## Configuration

### Setting Up Providers

1. **Via TUI Settings Menu** (Interactive):

   ```bash
   $ prompt-enhancer
   # Select "Settings" → Choose provider → Enter API Key → Select Model
   ```

2. **Manual Config File**:
   Edit `~/.prompt-enhancer/config.json`:

   ```json
   {
    "version": "0.1.0",
    "providers": {
     "gemini": {
      "name": "gemini",
      "apiKey": "your-api-key",
      "model": "gemini-2.5-flash",
      "enabled": true
     },
     "copilot": {
      "name": "copilot",
      "apiKey": "your-api-key",
      "model": "gpt-4o",
      "enabled": true
     },
     "kilo": {
      "name": "kilo",
      "apiKey": "your-api-key",
      "model": "auto",
      "enabled": true
     }
    },
    "defaultProvider": "gemini",
    "maxTokens": 500,
    "temperature": 1.0,
    "saveHistory": true,
    "streaming": true,
    "theme": "dark"
   }
   ```

## Usage Examples

### Interactive Enhancement

```bash
$ prompt-enhancer
# Select "Enhance Prompt" → Type your prompt → Choose provider → View result
```

### Quick CLI Enhancement

```bash
prompt-enhancer -p "write a hello world program"
```

### View Enhancement History

```bash
$ prompt-enhancer
# Select "View History" to browse past enhancements
```

### Get Help

```bash
$ prompt-enhancer --help
$ prompt-enhancer
# Select "Help" in menu for interactive guide
```

## Supported Models

### Gemini

- `gemini-2.5-flash` (default)
- `gemini-2.0-pro`
- `gemini-1.5-flash`
- `gemini-1.5-pro`

### Copilot / OpenAI

- `gpt-4o` (default)
- `gpt-4.1`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

### Kilo Gateway

- `auto` (default) - Automatically routes to best available free model
- Any model supported by Kilo's router

## Configuration Files

- **Config**: `~/.prompt-enhancer/config.json` - Provider settings, API keys, preferences
- **History**: `~/.prompt-enhancer/history.json` - Enhancement history with timestamps

## API Keys Setup

### Gemini

Get your API key at: <https://makersuite.google.com/app/apikey>

### OpenAI / Copilot

Get your API key at: <https://platform.openai.com/api-keys>

### Kilo Gateway

Get your key at: <https://kilo.dev> (or use free models with no key)

## Commands

```
$ prompt-enhancer --help

  Usage
    $ prompt-enhancer
    $ prompt-enhancer --prompt "your prompt"
    $ prompt-enhancer enhance "your prompt"

  Options
    --prompt, -p              Prompt text for headless mode
    --output, -o              Write output to a file
    --output-format           Output format: auto | txt | json | md (default: auto)
    --verbose                 Verbosity level: 1 | 2 | 3 (default: 1)
    --debug                   Enable debug diagnostics + API request/response logs
    --trace                   Enable step-by-step execution trace
    --about                   Show package metadata
    --version, -v             Show version
    --help, -h                Show help

  Subcommands
    help                      Show comprehensive help
    about                     Show package metadata
    version                   Show version details
    enhance                   Run headless enhancement using positional prompt text

  Examples
    $ prompt-enhancer
    $ prompt-enhancer -p "build a cli to enhance prompts"
    $ prompt-enhancer -p "summarize this architecture" -o .\out\result.json --output-format json
    $ prompt-enhancer enhance "design API retries" --debug --trace --verbose 3
    $ prompt-enhancer --help
```

## Architecture

### Project Structure

```
src/
├── cli.tsx                 # CLI entry point and routing
├── app.tsx                 # Interactive TUI main app
├── commands/               # Command implementations
│   ├── direct-enhance.tsx  # CLI enhancement
│   ├── about.tsx
│   ├── help.tsx
│   └── version.tsx
├── components/             # React/Ink TUI components
│   ├── enhance-prompt.tsx  # Interactive enhancement UI
│   ├── settings.tsx        # Provider configuration UI
│   ├── history-viewer.tsx  # History browsing UI
│   └── menu.tsx            # Menu component
└── lib/                    # Core libraries
    ├── providers/          # Provider implementations
    │   ├── gemini.ts
    │   ├── copilot.ts
    │   ├── kilo.ts
    │   ├── base.ts         # Abstract base provider
    │   └── index.ts        # Provider registry
    ├── config/             # Configuration management
    │   ├── manager.ts      # Config read/write
    │   ├── schema.ts       # Zod validation
    │   └── types.ts        # TypeScript types
    ├── enhancement/        # Enhancement engine
    │   └── engine.ts       # Streaming enhancement logic
    ├── history/            # History management
    │   └── manager.ts      # History persistence
    └── utils/              # Utilities
```

## Development

### Build

```bash
bun run build
```

### Lint & Format

```bash
bun run lint
bun run format
```

### Type Check

```bash
bun run typecheck
```

### Full Build Pipeline

```bash
bun run build  # Runs format, lint, typecheck, then compile
```

## Technology Stack

- **React 18** - Component framework
- **Ink 5.2.1** - Terminal UI rendering
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **Meow** - CLI argument parsing
- **Provider SDKs**:
  - `@google/generative-ai` - Gemini API
  - `openai` - OpenAI/Copilot API
  - Custom HTTP client for Kilo

## Notes

- Configuration is stored locally in `~/.prompt-enhancer/`
- API keys are stored unencrypted in config.json (consider using environment variables for production)
- History is automatically saved unless disabled in config
- Streaming output requires provider and model support

## License

MIT
