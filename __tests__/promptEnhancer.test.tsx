// Unit tests for EnhancementEngine - focus on prompt enhancement logic

// Mock the providers module before importing the engine
const fakeProvider = {
	enhance: jest.fn(async (prompt: string) => `ENHANCED: ${prompt}`),
	enhanceStream: jest.fn(async function* (prompt: string) {
		yield `ENHANCED_PART1: ${prompt}`;
		yield `ENHANCED_PART2: ${prompt}`;
	}),
	getAvailableModels: jest.fn(async () => ['test-model']),
	validateCredentials: jest.fn(async () => true),
};

jest.mock(
	'../src/lib/providers/index',
	() => ({
		getProvider: (name: string) => fakeProvider,
	}),
	{virtual: false},
);

import {EnhancementEngine} from '../src/lib/enhancement/engine';
import {ConfigManager} from '../src/lib/config/manager';

describe('EnhancementEngine', () => {
	test('enhances prompt with valid input', async () => {
		const configManager = new ConfigManager();
		// Ensure the default provider is set to a provider that is enabled
		configManager.setProvider('test', {name: 'test', enabled: true});
		configManager.setSetting('defaultProvider', 'test');

		const historyManagerStub: any = {addEntry: jest.fn(async () => undefined)};

		const engine = new EnhancementEngine(configManager, historyManagerStub);

		const response = await engine.enhance({prompt: 'Hello world'});

		expect(response.originalPrompt).toBe('Hello world');
		expect(response.enhancedPrompt).toBe('ENHANCED: Hello world');
		expect(response.provider).toBe('test');
		expect(typeof response.duration).toBe('number');
		expect(historyManagerStub.addEntry).toHaveBeenCalled();
	});

	test('streams enhancement chunks and returns final response', async () => {
		const configManager = new ConfigManager();
		configManager.setProvider('test', {name: 'test', enabled: true});
		configManager.setSetting('defaultProvider', 'test');

		const historyManagerStub: any = {addEntry: jest.fn(async () => undefined)};
		const engine = new EnhancementEngine(configManager, historyManagerStub);

		const chunks: string[] = [];
		const gen = engine.enhanceStream({prompt: 'Stream me'});

		for await (const chunk of gen) {
			chunks.push(chunk);
		}

		// The generator returns the final response as the return value of the generator; however
		// in this test we only assert that chunks were yielded and history was saved.
		expect(chunks.length).toBeGreaterThanOrEqual(2);
		expect(chunks[0]).toContain('ENHANCED_PART1');
		expect(historyManagerStub.addEntry).toHaveBeenCalled();
	});
});
