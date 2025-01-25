import type { CompanionOptionValues } from '@companion-module/base'
import { describe, expect, test } from '@jest/globals'
import { optionConversions, optionNullConversions } from './option-conversion'

describe('optionConversions', () => {
	const OptId = 'foobar'

	type Semantic = 15 | 16 | 17

	test('without conversion', () => {
		const [getSemantic, semanticToOption] = optionConversions<Semantic, typeof OptId>(
			OptId,
			[
				['0F', 15],
				['10', 16],
				['11', 17],
			],
			15,
			'10',
		)

		expect(getSemantic({ [OptId]: '0F' })).toBe(15)
		expect(getSemantic({ [OptId]: '10' })).toBe(16)
		expect(getSemantic({ [OptId]: '11' })).toBe(17)
		expect(getSemantic({ [OptId]: '12' })).toBe(15)
		expect(getSemantic({ [OptId]: '0E' })).toBe(15)

		expect(semanticToOption(15)).toBe('0F')
		expect(semanticToOption(16)).toBe('10')
		expect(semanticToOption(17)).toBe('11')
		expect(semanticToOption(18 as Semantic)).toBe('10')
	})

	test('with conversion', () => {
		const [getSemantic, semanticToOption] = optionConversions<Semantic, typeof OptId>(
			OptId,
			[
				['0F', 15],
				['10', 16],
				['11', 17],
			],
			15,
			'10',
			(option: CompanionOptionValues[typeof OptId]) => String(option).toUpperCase(),
		)

		expect(getSemantic({ [OptId]: '0f' })).toBe(15)
		expect(getSemantic({ [OptId]: '0F' })).toBe(15)
		expect(getSemantic({ [OptId]: '10' })).toBe(16)
		expect(getSemantic({ [OptId]: '11' })).toBe(17)
		expect(getSemantic({ [OptId]: '12' })).toBe(15)
		expect(getSemantic({ [OptId]: '0E' })).toBe(15)

		expect(semanticToOption(15)).toBe('0F')
		expect(semanticToOption(16)).toBe('10')
		expect(semanticToOption(17)).toBe('11')
		expect(semanticToOption(18 as Semantic)).toBe('10')
	})
})

describe('optionNullConversions', () => {
	const OptId = 'foobar'

	type Semantic = '0F' | '10' | '11'

	test('without conversion', () => {
		const [getSemantic, semanticToOption] = optionNullConversions<Semantic, typeof OptId>(
			OptId,
			['0F', '10', '11'],
			'10',
		)

		expect(getSemantic({ [OptId]: '0F' })).toBe('0F')
		expect(getSemantic({ [OptId]: '10' })).toBe('10')
		expect(getSemantic({ [OptId]: '11' })).toBe('11')
		expect(getSemantic({ [OptId]: '12' })).toBe('10')

		expect(semanticToOption('0F')).toBe('0F')
		expect(semanticToOption('10')).toBe('10')
		expect(semanticToOption('11')).toBe('11')
		expect(semanticToOption('12' as Semantic)).toBe('10')
	})

	test('with conversion', () => {
		const [getSemantic, semanticToOption] = optionNullConversions<Semantic, typeof OptId>(
			OptId,
			['0F', '10', '11'],
			'10',
			(option: CompanionOptionValues[typeof OptId]) => String(option).toUpperCase(),
		)

		expect(getSemantic({ [OptId]: '0f' })).toBe('0F')
		expect(getSemantic({ [OptId]: '0F' })).toBe('0F')
		expect(getSemantic({ [OptId]: '10' })).toBe('10')
		expect(getSemantic({ [OptId]: '11' })).toBe('11')
		expect(getSemantic({ [OptId]: '12' })).toBe('10')

		expect(semanticToOption('0F')).toBe('0F')
		expect(semanticToOption('10')).toBe('10')
		expect(semanticToOption('11')).toBe('11')
		expect(semanticToOption('12' as Semantic)).toBe('10')
	})
})
