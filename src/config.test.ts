import { describe, expect, test } from '@jest/globals'
import { addDebugLoggingOptionToConfig, configIsMissingDebugLogging, type PtzOpticsConfig } from './config.js'

describe('config upgrade to specify debug logging', () => {
	test('config without debug logging', () => {
		const configMissingDebugLogging = {
			host: '127.0.0.1',
			port: '5678',
		} as PtzOpticsConfig

		expect(configIsMissingDebugLogging(configMissingDebugLogging)).toBe(true)

		addDebugLoggingOptionToConfig(configMissingDebugLogging)

		expect(configIsMissingDebugLogging(configMissingDebugLogging)).toBe(false)
		expect(configMissingDebugLogging.debugLogging).toBe(false)
	})

	test('config with debug logging=false', () => {
		const configWithDebugLoggingFalse: PtzOpticsConfig = {
			host: '127.0.0.1',
			port: '5678',
			debugLogging: false,
		}

		expect(configIsMissingDebugLogging(configWithDebugLoggingFalse)).toBe(false)
		expect(configWithDebugLoggingFalse.debugLogging).toBe(false)
	})

	test('config with debug logging=true', () => {
		const configWithDebugLoggingTrue: PtzOpticsConfig = {
			host: '127.0.0.1',
			port: '5678',
			debugLogging: true,
		}

		expect(configIsMissingDebugLogging(configWithDebugLoggingTrue)).toBe(false)
		expect(configWithDebugLoggingTrue.debugLogging).toBe(true)
	})
})
