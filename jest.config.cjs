module.exports = {
	preset: 'ts-jest/presets/default-esm',
	testEnvironment: 'node',
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.json',
				useESM: true,
			},
		],
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
		'^src/(.*)\\.js$': '<rootDir>/src/$1',
	},
	transformIgnorePatterns: ['node_modules/(?!(ink-testing-library)/)'],
	testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
};
