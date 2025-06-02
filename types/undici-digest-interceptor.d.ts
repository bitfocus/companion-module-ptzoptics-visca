declare module 'undici-digest-interceptor' {
	import type { Dispatcher } from 'undici'

	export interface DigestInterceptorOptions {
		username: string
		password: string
		urls?: string[]
		retryOptions?: {
			statusCodes?: number[]
			maxRetries?: number
			retryAfter?: number
			minTimeout?: number
			timeoutFactor?: number
		}
	}

	/**
	 * Creates a Digest Auth interceptor that wraps an Undici Dispatcher.
	 * @param options Configuration options including username, password, and optional retry settings.
	 * @returns A dispatcher function for use with Undici requests.
	 */
	export function createDigestInterceptor(options: DigestInterceptorOptions): Dispatcher
}
