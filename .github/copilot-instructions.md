# Copilot instructions — prompt-enhancer

Purpose: Quick reference for Copilot sessions to understand how to build, run, test, and navigate this repository, plus repository-specific conventions.

---

## 1) Build, test, and lint commands

Use the npm scripts defined in package.json (project root):

- Full build (includes format, lint:fix, typecheck via `prebuild`):

```bash
bun run build
```

- Development (run the source CLI/TUI directly):

```bash
bun run dev   # uses bun to run src/cli.tsx (requires bun)
# if bun is not available, run the source with ts-node:
bunx ts-node src/cli.tsx
```

- Type check only:

```bash
bun run typecheck   # tsc --noEmit
```

- Lint / fix:

```bash
bun run lint        # eslint src
bun run lint:fix    # eslint src --fix
# single file lint + fix:
bun eslint --fix path/to/file.tsx
```

- Format:

```bash
bun run format      # prettier --write .
# single file format:
bunx prettier --write path/to/file.ts
```

- Tests / single-test execution:

```bash
bun test            # runs prettier --check . && xo && ava (uses ava for unit tests)
# Run a single AVA test file (AVA uses the node loader from package.json):
bun ava path/to/test-file.ts
# Run tests that match a title substring:
# (AVA supports --match to run tests by title)
bunx ava --match "partial test title"
```

- Run the packaged binary (after build):

```bash
bun dist/cli.js -p "write a hello world program"
# or locally install for testing:
bun link && prompt-enhancer -p "..."
```

Notes:

- `bun run build` will run `prebuild` first (format, lint:fix, typecheck) because `prebuild` is defined in package.json.
- AVA test runner is configured in package.json to use the ts-node/esm loader; running `bunx ava` will pick up that configuration.

---

## 2) High-level architecture (big picture)

- Entry points:
  - `src/cli.tsx` — CLI entry (meow) and direct commands.
  - `src/app.tsx` — Interactive TUI (Ink + React) application.

- Command surface:
  - `src/commands/` — CLI command implementations (e.g., `direct-enhance.tsx`, `help.tsx`, `version.tsx`).
  - `src/components/` — Ink components used by the TUI (menu, settings, history viewer, enhance UI).

- Core libraries (`src/lib/`):
  - `lib/providers/` — Provider implementations and a provider registry (`gemini.ts`, `copilot.ts`, `kilo.ts`, `base.ts`, `index.ts`).
  - `lib/config/` — Config manager, Zod schema and types; config stored at `~/.prompt-enhancer/config.json`.
  - `lib/enhancement/engine.ts` — Streaming enhancement engine (coordinates providers, streaming results to the TUI).
  - `lib/history/manager.ts` — Persistence for enhancement history at `~/.prompt-enhancer/history.json`.
  - `lib/utils/` — Misc helpers.

- Packaging:
  - Build output is `dist/`; `package.json` `bin` points to `dist/cli.js` for the installed binary.

---

## 3) Key conventions and repository-specific patterns

- Provider pattern: create a provider by implementing the abstract/base provider in `lib/providers/base.ts` and register it in `lib/providers/index.ts`. Providers should implement the same `enhance(...)` (or streaming) contract so the engine can call them interchangeably.

- Config validation: use `lib/config/schema.ts` (Zod) via `lib/config/manager.ts`. Always use the manager to read/write config so values are validated and normalized.

- Streaming model: `lib/enhancement/engine.ts` exposes a streaming API (async iterable/events). TUI components subscribe to those streams; tests that assert streaming behavior should stub/mock providers and assert against emitted chunks.

- Ink & React: UI components are plain React function components written in `.tsx`. Keep TUI logic in `components/` and command wiring in `commands/`.

- Tests: AVA is configured for TypeScript via `--loader=ts-node/esm` (see package.json). Use `bunx ava path/to/test.ts` for a single file; `bun test` runs the whole checks pipeline (prettier check, xo, ava).

- Dev workflow: `bun run dev` uses `bun run ...` for a fast interactive run; builds and CI use Node/TypeScript compilation (`tsc`).

- Secrets & config: API keys are persisted unencrypted in `~/.prompt-enhancer/config.json` by current implementation — do not commit keys to the repo; prefer environment variables for CI.

---

## 4) Files / places to look for important logic

- `src/cli.tsx` — CLI parsing and command dispatch
- `src/app.tsx` — Ink app bootstrap
- `src/lib/providers/*` — provider implementations and registration
- `src/lib/enhancement/engine.ts` — streaming enhancement orchestration
- `src/lib/config/*.ts` — config manager and Zod schemas
- `src/lib/history/manager.ts` — persistence API used by the UI

---

## 5) Tips for Copilot sessions (how to help it help you)

- When asked to add a provider, point Copilot to `lib/providers/base.ts` and `lib/providers/index.ts` so registration and interface surfaces are respected.
- For changes that affect runtime config or history schemas, update `lib/config/schema.ts` and `lib/config/manager.ts` together; include a test demonstrating validation behavior.
- Streaming logic is centralized in `lib/enhancement/engine.ts`; look here to understand backpressure, chunking, and how UI subscriptions work.

---

## 6) AI assistant configuration files

- This repo currently documents its usage in `readme.md` and package.json. If you add assistant-specific files (e.g., `CLAUDE.md`, `AGENTS.md`, `.cursorrules`), add a short section in this instructions file so Copilot knows to load and surface them.

---

If you'd like this expanded (examples for tests, a checklist for adding providers, or automated tasks for CI), say which area to expand.
