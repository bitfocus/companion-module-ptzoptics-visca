import type { Bytes } from './byte.js'

function prettyOne(byte: number): string {
	return byte.toString(16).toUpperCase().padStart(2, '0')
}

/** Debug representation of a byte value. */
export function prettyByte(byte: number): string {
	return '0x' + prettyOne(byte)
}

/** Debug representation of a byte list. */
export function prettyBytes(bytes: Bytes | Uint8Array): string {
	// Explicitly apply the Array map function so this works on both arrays and
	// typed arrays.
	return `[${Array.prototype.map.call(bytes, prettyOne).join(' ')}]`
}
