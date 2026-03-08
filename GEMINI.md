# GEMINI.md

## Project Overview

`prompt-enhancer` is a CLI/TUI tool designed to enhance user prompts using various LLM providers. It features both an interactive Terminal User Interface (TUI) powered by React and Ink, and a headless CLI mode for direct script integration.

- **Main Technologies:** React 18, Ink 5.2.1, TypeScript, Bun, Zod, Meow.
- **LLM Providers:** Gemini, Copilot (OpenAI), Kilo Gateway, OpenCode Zen.
- **Architecture:**
  - **TUI (Interactive):** `src/app.tsx` and components in `src/components/`.
  - **CLI (Headless):** `src/cli.tsx` and commands in `src/commands/`.
  - **Core Logic:** `src/lib/enhancement/engine.ts` (orchestration).
  - **Providers:** Abstracted via `src/lib/providers/base.ts` and managed by `ProviderFactory`.
  - **Persistence:** Config and history managed in `~/.prompt-enhancer/`.

## Building and Running

The project uses `bun` as its primary runtime and package manager, but is also compatible with standard `npm`/`tsc` workflows.

- **Development:** `bun run dev` (runs `src/cli.tsx` directly).
- **Build (JS):** `bun run build` (runs `tsc`).
- **Compile (Binary):** `bun run compile` (creates a standalone executable using `bun build --compile`).
- **Test:** `bun run test` (runs prettier check, xo linting, and jest tests).
- **Individual Tests:** `bun run test:jest` (runs Jest tests via `jest.config.cjs`).
- **Linting:** `bun run lint` (ESLint) and `bun run typecheck` (tsc --noEmit).
- **Formatting:** `bun run format` (Prettier).
- **Clean:** `bun run clean` (deletes `dist/`).

## Development Conventions

- **CLI/TUI Framework:** Built with **Ink**, a React-based framework for CLIs. Component-based UI logic is found in `src/components/`.
- **Command Routing:** Handled in `src/cli.tsx` using `meow` for flag parsing.
- **Provider Pattern:** Adding a new LLM provider involves:
  1. Creating a class extending `Provider` in `src/lib/providers/`.
  2. Registering it in `ProviderFactory` within `src/lib/providers/index.ts`.
- **Configuration:** Validated using **Zod** schemas in `src/lib/config/schema.ts`.
- **Testing:** Uses **Jest** with `ink-testing-library` for TUI component testing. Tests are located in `__tests__/`.
- **Formatting:** Strict Prettier and XO linting rules are enforced. Always run `bun run format` before committing.
- **Streaming:** The enhancement engine supports streaming output via `AsyncGenerator` in `enhanceStream`.

## Usage Instructions

- **Interactive Mode:** Run `prompt-enhancer` (or `bun run dev`) without arguments.
- **Direct Enhancement:** `prompt-enhancer --prompt "Your prompt"` or `prompt-enhancer enhance "Your prompt"`.
- **Settings:** Configured via the TUI menu or manually at `~/.prompt-enhancer/config.json`.
