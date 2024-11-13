/** Determine if a number is a byte. */
function isByte(b: number): boolean {
	return (b & 0xff) === b
}

/** Ensure every number in bytes is an actual byte value. */
export function checkBytes(bytes: readonly number[]): void {
	for (const b of bytes) {
		if (!isByte(b)) {
			throw new RangeError('non-byte found')
		}
	}
}
