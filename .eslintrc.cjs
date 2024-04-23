module.exports = {
	extends: './node_modules/@companion-module/tools/eslint/main.cjs',
	rules: {
		radix: 'error',
		'n/no-unpublished-import': [
			'error',
			{
				allowModules: ['@jest/globals'],
			},
		],
	},
	overrides: [],
}
