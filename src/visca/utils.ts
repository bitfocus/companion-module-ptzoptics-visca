/** Determine if a number is a byte. */
function isByte(b: number): boolean {
	return (b & 0xff) === b
}

/** Debug representation of a byte value. */
function prettyByte(byte: number): string {
	return ('0' + byte.toString(16).toUpperCase()).slice(-2)
}

/** Debug representation of a byte list. */
export function prettyBytes(bytes: readonly number[] | Buffer): string {
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
