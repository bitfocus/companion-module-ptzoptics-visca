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
