import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableJest: true,
	enableTypescript: true,
	ignores: [
		// This file isn't part of the build, so eslint errors if we try to lint
		// it.
		'jest.config.ts',
	],
})

const customConfig = [
	...baseConfig,

	{
		ignores: ['eslint.config.*'],
		rules: {
			'n/no-missing-import': 'off',
			'n/no-unpublished-import': [
				'error',
				{
					allowModules: ['@jest/globals'],
				},
			],
			'@typescript-eslint/strict-boolean-expressions': 'error',
			eqeqeq: 'error',
			radix: 'error',
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					fixStyle: 'inline-type-imports',
				},
			],
		},
	},
]

export default customConfig
