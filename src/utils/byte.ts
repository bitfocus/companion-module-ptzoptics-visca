/** A sequence of bytes. */
export type Bytes = readonly number[]

/**
 * A nonempty list of distinct nibble indexes within a message.  (A nibble is
 * the upper or lower four-bit half of a byte.)
 *
 * In a command/inquiry that begins with the byte `0x81`, `0` would refer to the
 * `8`, `1` would refer to the `1`, and so on in following bytes.
 */
export type Nibbles = readonly [number, ...number[]]

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
