/** Determine if a number is a byte. */
function isByte(b: number): boolean {
	return (b & 0xff) === b
}

/** Debug representation of a byte value. */
function prettyByte(byte: number): string {
	return ('0' + byte.toString(16).toUpperCase()).slice(-2)
}

/** Debug representation of a byte list. */
export function prettyBytes(bytes: readonly number[] | Uint8Array): string {
	// Explicitly apply the Array map function so this works on both arrays and
	// typed arrays.
	return `[${Array.prototype.map.call(bytes, prettyByte).join(' ')}]`
}

/** Ensure every number in bytes is an actual byte value. */
export function checkBytes(bytes: readonly number[]): void {
	for (const b of bytes) {
		if (!isByte(b)) {
			throw new RangeError('non-byte found')
		}
	}
}

/** Return an unresolved promise and resolve/reject functions for it. */
export function promiseWithResolvers<T>(): {
	promise: Promise<T>
	resolve: (value: T) => void
	reject: (reason?: any) => void
} {
	let promiseResolve: (value: T) => void
	let promiseReject: (reason?: any) => void
	const promise = new Promise<T>((resolve: (value: T) => void, reject: (reason?: any) => void) => {
		promiseResolve = resolve
		promiseReject = reject
	})

	return {
		promise,
		resolve: promiseResolve!,
		reject: promiseReject!,
	}
}
