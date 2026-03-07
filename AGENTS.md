# AGENTS.md - Agent Guidelines for prompt-enhancer

This file contains guidelines for agentic coding agents working in this repository.

## Build, Lint, and Test Commands

### Core Commands

- **Full build**: `bun run build` (runs format, lint:fix, typecheck via `prebuild`)
- **Development**: `bun run dev` (runs src/cli.tsx directly with bun)
- **Type check**: `bun run typecheck` (tsc --noEmit)
- **Lint**: `bun run lint` (eslint src)
- **Lint fix**: `bun run lint:fix` (eslint src --fix)
- **Format**: `bun run format` (prettier --write .)

### Testing

- **Run all tests**: `bun test` (runs prettier --check . && xo && ava)
- **Single test file**: `bun ava path/to/test-file.ts`
- **Test by title**: `bunx ava --match "partial test title"`
- **Test with coverage**: `bunx ava --coverage`

### Package Management

- **Install dependencies**: `bun install`
- **Clean build**: `bun run clean` (deletes dist folder)
- **Create binary**: `bun run compile` (builds executable)
- **Release**: `bun run release` (runs release script)

## Code Style Guidelines

### TypeScript Configuration

- Uses `@sindresorhus/tsconfig` as base
- Root directory: `src/`, Output: `dist/`
- JSX: `react-jsx` pragma
- Strict mode enabled via base config

### Import Organization

- **Order**: External libraries → Internal modules → Relative imports
- **Sorting**: Prettier-plugin-sort-imports automatically sorts imports
- **Format**: Use ES6 import/export syntax exclusively
- **Path aliases**: None configured, use relative paths

### Formatting Rules (Prettier)

- **Print width**: 80 characters
- **Tab width**: 2 spaces
- **Tabs**: Never use tabs, always spaces
- **Semicolons**: Always required
- **Quotes**: Double quotes for strings
- **Trailing commas**: Required for multi-line structures
- **JSX**: Single attribute per line, double quotes

### ESLint Configuration

- **Base**: `@eslint/js/recommended`
- **TypeScript**: `@typescript-eslint/recommended`
- **React**: `eslint-plugin-react/recommended`
- **Rules**: Follows XO React style guide with React-specific overrides
- **File extensions**: .js, .mjs, .cjs, .ts, .mts, .cts, .jsx, .tsx

### Naming Conventions

- **Files**: kebab-case for components (e.g., `enhance-prompt.js`), PascalCase for classes
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for exported constants
- **Functions**: camelCase, descriptive names
- **Classes**: PascalCase
- **Interfaces**: PascalCase with descriptive names
- **Types**: PascalCase

### React/Ink Component Guidelines

- **Components**: Use function components with hooks
- **Props**: Define interfaces for all component props
- **State**: Use useState, useEffect, useContext as needed
- **Styling**: Use Ink components (Box, Text) for layout
- **Event handlers**: Prefix with `handle` (e.g., `handleMenuSelect`)

### Error Handling

- **Try-catch**: Wrap async operations in try-catch blocks
- **Error types**: Use Error instances, provide meaningful messages
- **User feedback**: Display errors in UI with appropriate styling
- **Logging**: Use console.log for debug, console.error for errors

### Architecture Patterns

#### Provider Pattern

- **Base class**: `src/lib/providers/base.ts`
- **Implementation**: Extend base class and implement abstract methods
- **Registration**: Add to `src/lib/providers/index.ts`
- **Interface**: Must implement enhance(), enhanceStream(), getAvailableModels(), validateCredentials()

#### Configuration Management

- **Schema**: `src/lib/config/schema.ts` (Zod)
- **Manager**: `src/lib/config/manager.ts` (handles validation/loading)
- **Storage**: `~/.prompt-enhancer/config.json`

#### Enhancement Engine

- **Core**: `src/lib/enhancement/engine.ts`
- **Streaming**: AsyncGenerator-based streaming API
- **Providers**: Coordinates between multiple provider implementations

#### History Management

- **Manager**: `src/lib/history/manager.ts`
- **Storage**: `~/.prompt-enhancer/history.json`
- **Schema**: `src/lib/config/schema.ts` (HistoryEntrySchema)

### File Structure

```
src/
├── cli.tsx              # CLI entry point (meow)
├── app.tsx              # Main TUI application (Ink + React)
├── commands/           # CLI command implementations
├── components/         # Ink React components
└── lib/
    ├── providers/      # LLM provider implementations
    ├── config/         # Configuration management
    ├── enhancement/    # Enhancement engine
    ├── history/        # History management
    └── types/          # Shared TypeScript types
```

### Testing Guidelines

- **Framework**: AVA with TypeScript support
- **Loader**: ts-node/esm (configured in package.json)
- **Test files**: .tsx extension for React components
- **Structure**: Use descriptive test names, arrange-act-assert pattern
- **Component testing**: Use ink-testing-library for TUI components
- **Provider testing**: Mock providers for streaming behavior tests

### Development Workflow

1. **Format**: `bun run format` (prettier --write .)
2. **Lint**: `bun run lint` (eslint src)
3. **Type check**: `bun run typecheck` (tsc --noEmit)
4. **Test**: `bun test` (runs all checks)
5. **Build**: `bun run build` (full pipeline)

### Package.json Scripts

- **prebuild**: Runs format, lint:fix, typecheck before build
- **build**: TypeScript compilation (tsc)
- **dev**: Direct development run (bun run src/cli.tsx)
- **compile**: Creates executable binary
- **release**: Runs release script

### Security Considerations

- **API keys**: Stored in `~/.prompt-enhancer/config.json` (unencrypted)
- **Environment variables**: Use for CI/CD secrets
- **Input validation**: Always validate user input and config data
- **Error messages**: Don't expose sensitive information in error messages

### Performance Guidelines

- **Streaming**: Use async generators for large responses
- **Caching**: Implement caching for expensive operations
- **Memory**: Clean up resources in useEffect cleanup functions
- **Bundle size**: Monitor with appropriate tooling

### Documentation

- **Components**: Add JSDoc comments for complex components
- **APIs**: Document public interfaces in lib/types
- **Changes**: Update CHANGELOG.md for new features
- **README**: Keep user-facing documentation current
