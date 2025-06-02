import { Regex } from '@companion-module/base'
import type { PtzOpticsConfig } from './config.js'

/** Options information for the camera connection being manipulated. */
export type PtzOpticsOptions = {
	/**
	 * The TCP/IP hostname of the camera, or null if no hostname has been set.
	 */
	host: string | null

	/** The TCP/IP port used to connect to the camera. */
	port: number

	/* poll interval for HTTP Status */
	httpPollInterval: number

	/* username for HTTP actions or polling */
	httpUsername: string | null

	/* password for HTTP actions or polling */
	httpPassword: string | null

	/**
	 * Whether to perform debug logging of extensive details concerning the
	 * connection: messages sent and received, internal command/inquiry/reply
	 * handling state, etc.
	 */
	debugLogging: boolean
}

function toHost(host: PtzOpticsConfig['host']): string | null {
	if (host !== undefined) {
		const hostStr = String(host)
		if (new RegExp(Regex.IP.slice(1, -1)).test(hostStr)) {
			return hostStr
		}
	}

	return null
}

const DefaultPort = 5678

function toPort(port: PtzOpticsConfig['port']): number {
	if (port !== undefined) {
		const portStr = String(port)
		if (new RegExp(Regex.PORT.slice(1, -1)).test(portStr)) {
			return Number(portStr)
		}
	}

	return DefaultPort
}

const DefaultHTTPpollInterval = 0

function toHttpPollInterval(httpPollInterval: PtzOpticsConfig['httpPollInterval']): number {
	if (httpPollInterval !== undefined) {
		return Number(httpPollInterval)
	}

	return DefaultHTTPpollInterval
}

function toHttpUsername(httpUsername: PtzOpticsConfig['httpUsername']): string | null {
	if (httpUsername !== undefined) {
		return String(httpUsername)
	}

	return null
}

function toHttpPassword(httpPassword: PtzOpticsConfig['httpPassword']): string | null {
	if (httpPassword !== undefined) {
		return String(httpPassword)
	}

	return null
}

function toDebugLogging(debugLogging: PtzOpticsConfig['debugLogging']): boolean {
	return Boolean(debugLogging)
}

/** Compute instance options from instance configuration info. */
export function optionsFromConfig({
	// Comments indicate the expected types of the various config fields.
	host, // string
	port, // string
	httpPollInterval, // number
	httpUsername, // string
	httpPassword, // string
	debugLogging, // boolean
}: PtzOpticsConfig): PtzOpticsOptions {
	return {
		host: toHost(host),
		port: toPort(port),
		httpPollInterval: toHttpPollInterval(httpPollInterval),
		httpUsername: toHttpUsername(httpUsername),
		httpPassword: toHttpPassword(httpPassword),
		debugLogging: toDebugLogging(debugLogging),
	}
}

/**
 * Instance options suitable for use at instance creation, before the actual
 * options are available.
 */
export function noCameraOptions(): PtzOpticsOptions {
	return {
		// Null host ensures that these options won't trigger a connection.
		host: null,
		port: DefaultPort,
		httpPollInterval: 0,
		httpUsername: null,
		httpPassword: null,
		debugLogging: false,
	}
}

/**
 * For an already-started instance/connection using the given old options,
 * determine whether applying the new options to it requires restarting the
 * connection.
 */
export function canUpdateOptionsWithoutRestarting(oldOptions: PtzOpticsOptions, newOptions: PtzOpticsOptions): boolean {
	// A different host or port straightforwardly requires a connection restart.
	if (oldOptions.host !== newOptions.host || oldOptions.port !== newOptions.port) {
		return false
	}

	// Debug logging can be turned on or off at runtime without restarting.

	// Otherwise we can update options without restarting.
	return true
}
