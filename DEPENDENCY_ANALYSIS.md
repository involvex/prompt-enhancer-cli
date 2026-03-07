# Dependency Analysis & Update Recommendations

Generated: 2026-03-07

## Summary

The project has 14 outdated packages. Most are minor/patch updates, but some major version updates require careful consideration.

## Update Recommendations by Category

### 🔴 CRITICAL - Hold / Requires Testing

These are major version updates that may break compatibility:

| Package       | Current | Latest | Impact                                      | Recommendation                                          |
| ------------- | ------- | ------ | ------------------------------------------- | ------------------------------------------------------- |
| **React**     | 18.3.1  | 19.2.4 | Major version - API changes, new hooks      | 🔴 HOLD - Major version bump, requires testing with Ink |
| **React-DOM** | 18.3.1  | 19.2.4 | Major version - Must match React            | 🔴 HOLD - Dependent on React update                     |
| **Ink**       | 5.2.1   | 6.8.0  | Major version - Component API changes       | 🔴 HOLD - Core TUI dependency, requires full retest     |
| **OpenAI**    | 4.104.0 | 6.27.0 | Major version - API client breaking changes | 🟡 CAUTION - Affects Copilot provider, test first       |
| **Zod**       | 3.25.76 | 4.3.6  | Major version - Schema validation changes   | 🟡 CAUTION - May affect config validation               |

### 🟡 MODERATE - Recommend Updating

These are minor/patch versions or compatible major versions:

| Package                       | Current | Latest  | Impact                                       | Recommendation                                    |
| ----------------------------- | ------- | ------- | -------------------------------------------- | ------------------------------------------------- |
| **@google/generative-ai**     | 0.21.0  | 0.24.1  | Patch version - Bug fixes, likely compatible | ✅ SAFE - Small patch, likely no breaking changes |
| **@types/react**              | 18.3.28 | 19.2.14 | Type defs only - Update with React if needed | ⏳ DEFER - Update together with React later       |
| **eslint-config-xo-react**    | 0.27.0  | 0.29.0  | Linting config - Non-critical                | ✅ SAFE - Update recommended                      |
| **eslint-plugin-react-hooks** | 4.6.2   | 7.0.1   | Linting plugin - Non-critical                | ✅ SAFE - Update recommended                      |

### 🟢 LOW PRIORITY - Dev Dependencies Only

These are development-only and safe to update:

| Package                 | Current | Latest | Impact                 | Recommendation                             |
| ----------------------- | ------- | ------ | ---------------------- | ------------------------------------------ |
| **ava**                 | 5.3.1   | 7.0.0  | Test runner - Dev only | ✅ UPDATE LATER - When test suite is added |
| **xo**                  | 0.53.1  | 1.2.3  | Linter - Dev only      | ✅ UPDATE LATER - When lint needs refresh  |
| **ink-testing-library** | 3.0.0   | 4.0.0  | Testing lib - Dev only | ✅ UPDATE LATER - When tests are added     |
| **@types/ink**          | 2.0.3   | 0.5.2  | Type defs - Dev only   | ✅ KEEP CURRENT - Latest is actually older |
| **@types/meow**         | 6.0.0   | 5.0.0  | Type defs - Dev only   | ✅ KEEP CURRENT - Latest is actually older |

## Detailed Analysis

### Priority 1: Patch Updates (Safe & Recommended) ✅

#### @google/generative-ai: 0.21.0 → 0.24.1

- **Risk Level**: LOW
- **Changes**: Patch version (0.21 → 0.24), likely bug fixes and improvements
- **Testing**: Minor - verify Gemini provider still works
- **Action**: ✅ **UPDATE NOW**
- **Command**: `npm install --save @google/generative-ai@latest`

#### eslint-config-xo-react: 0.27.0 → 0.29.0

- **Risk Level**: LOW
- **Changes**: Config/linting only, no impact on runtime
- **Testing**: None needed - run linter and verify no new issues
- **Action**: ✅ **UPDATE NOW**
- **Command**: `npm install --save-dev eslint-config-xo-react@latest`

#### eslint-plugin-react-hooks: 4.6.2 → 7.0.1

- **Risk Level**: LOW
- **Changes**: Linting plugin only, no runtime impact
- **Testing**: None needed - run linter and verify no new issues
- **Action**: ✅ **UPDATE NOW**
- **Command**: `npm install --save-dev eslint-plugin-react-hooks@latest`

### Priority 2: Hold for Later (Major Versions, Needs Planning)

#### React: 18.3.1 → 19.2.4

- **Risk Level**: HIGH
- **Breaking Changes**:
  - New hooks API
  - Component composition changes
  - Ink compatibility unknown with React 19
- **Testing**: Full TUI retest required
- **Action**: 🔴 **HOLD**
- **Reason**: Ink 5.2.1 may not support React 19 yet. Requires testing React 19 + Ink 5.2.1 compatibility
- **Future**: Investigate when Ink publishes React 19 support

#### Ink: 5.2.1 → 6.8.0

- **Risk Level**: CRITICAL
- **Breaking Changes**:
  - Component API may change
  - Compatibility with React 19 unclear
  - Existing codebase may not work with Ink 6
- **Testing**: Complete TUI rebuild likely needed
- **Action**: 🔴 **HOLD**
- **Reason**: Current implementation heavily customized for Ink 5.0.0 API constraints. Ink 6 may have different constraints.
- **Future**: Research Ink 6 compatibility in a separate branch

#### OpenAI: 4.104.0 → 6.27.0

- **Risk Level**: HIGH
- **Breaking Changes**:
  - Major version bump (4 → 6)
  - API client structure may have changed
  - Copilot provider implementation may break
- **Testing**: Full Copilot provider retest required
- **Action**: 🟡 **HOLD - CAUTION**
- **Reason**: Need to verify OpenAI SDK v6 is compatible with existing Copilot provider code
- **Future**: Create test branch to evaluate v6 compatibility

#### Zod: 3.25.76 → 4.3.6

- **Risk Level**: MEDIUM
- **Breaking Changes**:
  - Major version bump
  - Schema validation API may change
  - Config parsing could fail
- **Testing**: Config manager tests required
- **Action**: 🟡 **HOLD - CAUTION**
- **Reason**: All config and schema validation uses Zod. Need to verify schema definitions work in v4
- **Future**: Test config manager with Zod v4 before updating

### Priority 3: Dev Dependencies Only

#### ava, xo, ink-testing-library

- **Action**: ✅ **UPDATE LATER**
- **Reason**: Dev/test tools only. Not critical for MVP. Can update when test suite is implemented in Phase 7
- **Dependency**: Zod v4 update required for xo compatibility

#### @types packages with newer "Latest" being older

- **@types/ink**: Keep at 2.0.3
- **@types/meow**: Keep at 6.0.0
- **Reason**: NPM shows "latest" but these are actually downgrades. Keep current versions.

## Recommended Update Strategy

### Phase 1: Safe Updates Now ✅

```bash
# Patch updates - safe to apply immediately
npm install --save @google/generative-ai@latest
npm install --save-dev eslint-config-xo-react@latest eslint-plugin-react-hooks@latest

# Then rebuild and test
npm run build
```

### Phase 2: Major Version Evaluations 🔄

Create separate branches for each major version evaluation:

**React 19 Compatibility Branch**:

```bash
git checkout -b feature/react-19-upgrade
npm install react@19 react-dom@19 @types/react@19
# Full TUI testing required
```

**OpenAI SDK v6 Compatibility Branch**:

```bash
git checkout -b feature/openai-sdk-v6
npm install openai@6
# Copilot provider testing required
```

**Zod v4 Compatibility Branch**:

```bash
git checkout -b feature/zod-v4-upgrade
npm install zod@4
npm run build
npm run typecheck
# Config manager testing required
```

### Phase 3: Coordinated Major Updates 📦

After evaluating compatibility in separate branches:

1. Merge compatible major updates together
2. Run full integration tests
3. Version bump the project (e.g., 0.1.0 → 0.2.0)

## Current Status

**Recommended Action**:

1. ✅ Apply patch updates now (@google/generative-ai, eslint plugins)
2. 🔴 Hold major version upgrades until Phase 5+
3. ⏳ Plan major version evaluation branches for future

**Build Status**: ✅ PASSING
**TypeScript Status**: ✅ PASSING
**Test Status**: ⏳ No tests yet (Phase 7)

## Rollback Plan

If any updates cause issues:

```bash
# Revert to known-good versions
npm ci  # Install exact versions from package-lock.json
```

Package lock is committed to git, so previous working versions are always available.
