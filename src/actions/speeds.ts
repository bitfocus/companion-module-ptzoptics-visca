import type { DropdownChoice } from '@companion-module/base'

/**
 * Generate a dropdown choice list of integral speeds from `slow` to `fast`.
 *
 * @param slow
 *   The slowest speed.
 * @param fast
 *   The fastest speed.
 * @returns
 *   Dropdown choices for `Speed ${slow} (Slow)`, `Speed ${slow + 1}`, ...,
 *   `Speed ${fast - 1}`, `Speed ${fast} (Fast)`.
 */
export function speedChoices(slow: number, fast: number): DropdownChoice[] {
	const speeds: DropdownChoice[] = []
	for (let id = slow; id <= fast; id++) {
		speeds.push({ id, label: `Speed ${id}${id === slow ? ' (Slow)' : id === fast ? ' (Fast)' : ''}` })
	}
	return speeds
}
