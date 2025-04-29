/** Convert a readonly dictionary to an identical mutable dictionary. */
export type Mutable<Dict extends Readonly<object>> = {
	-readonly [K in keyof Dict]: Dict[K]
}
