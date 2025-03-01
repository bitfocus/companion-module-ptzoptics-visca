/** Convert a number to a two-digit hex string. */
export function twoDigitHex(n: number): string {
	return n.toString(16).padStart(2, '0')
}
