/**
 * Determine if a number is a byte.
 *
 * @param {number} b
 * @returns bool
 */
function isByte(b) {
	return (b & 0xff) === b
}

/**
 * Debug representation of a byte value.
 *
 * @param {number} byte A byte value
 * @returns {string} '00'..'FF' corresponding to the value passed in
 */
function prettyByte(byte) {
	return ('0' + byte.toString(16).toUpperCase()).slice(-2)
}

/**
 * Debug representation of a byte list.
 *
 * @param {number[] | Buffer} bytes
 * @returns {string} a debug representation of `bytes`
 */
export function prettyBytes(bytes) {
	// Explicitly apply the Array map function so this works on both arrays and
	// typed arrays.
	return `[${Array.prototype.map.call(bytes, prettyByte).join(' ')}]`
}

/**
 * Ensure every number in `bytes` is an actual byte value.
 *
 * @param {number[]} bytes
 */
export function checkBytes(bytes) {
	for (const b of bytes) {
		if (!isByte(b)) {
			throw new RangeError('non-byte found')
		}
	}
}
