module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
		'^.+\\.(ts|tsx)$': ['ts-jest', {tsconfig: 'tsconfig.json'}],
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
		'^src/(.*)\\.js$': '<rootDir>/src/$1',
	},
	transformIgnorePatterns: ['node_modules/(?!(ink-testing-library)/)'],
	testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
};
