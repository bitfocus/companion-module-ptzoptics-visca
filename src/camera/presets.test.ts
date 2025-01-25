import { describe, expect, test } from '@jest/globals'
import { isValidPreset } from './presets.js'

describe('isValidPreset', () => {
	test('too low', () => {
		expect(isValidPreset(-1)).toBe(false)
	})
	test('low', () => {
		expect(isValidPreset(0)).toBe(true)
		expect(isValidPreset(42)).toBe(true)
		expect(isValidPreset(89)).toBe(true)
	})
	test('midrange', () => {
		for (let n = 90; n <= 99; n++) {
			expect(isValidPreset(n)).toBe(false)
		}
	})
	test('hi', () => {
		expect(isValidPreset(100)).toBe(true)
		expect(isValidPreset(101)).toBe(true)
		expect(isValidPreset(253)).toBe(true)
		expect(isValidPreset(254)).toBe(true)
	})
	test('too hi', () => {
		expect(isValidPreset(255)).toBe(false)
	})
	test('NaN', () => {
		expect(isValidPreset(NaN)).toBe(false)
	})
})
