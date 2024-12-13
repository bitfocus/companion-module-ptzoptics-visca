// @ts-check

import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableJest: true,
	enableTypescript: true,
})

/**
 * @param {import('eslint').Linter.Config<import('eslint').Linter.RulesRecord>['files']} files
 * @param {readonly string[]} allowModules
 * @returns {import('eslint').Linter.Config<import('eslint').Linter.RulesRecord>}
 */
function permitLimitedUnpublishedImports(files, allowModules) {
	return {
		files,
		rules: {
			'n/no-unpublished-import': [
				'error',
				{
					allowModules,
				},
			],
		},
	}
}

const customConfig = [
	...baseConfig,

	{
		ignores: ['eslint.config.*'],
		rules: {
			'n/no-missing-import': 'off',
			'n/no-unpublished-import': 'error',
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

	permitLimitedUnpublishedImports(
		['src/**/*spec.ts', 'src/**/*test.ts', 'src/**/__tests__/*', 'src/**/__mocks__/*'],
		['@jest/globals'],
	),
	permitLimitedUnpublishedImports(['eslint.config.mjs'], ['@companion-module/tools']),
	permitLimitedUnpublishedImports(['jest.config.ts'], ['ts-jest']),
]

export default customConfig
