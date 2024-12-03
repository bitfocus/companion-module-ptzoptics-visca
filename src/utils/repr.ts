type Representable =
	| undefined
	| null
	| boolean
	| number
	| string
	| readonly Representable[]
	| { readonly [key: string]: Representable }

/** Generate a debug representation of `val`. */
export function repr(val: Representable): string {
	if (val === undefined) {
		return 'undefined'
	}
	return JSON.stringify(val)
}
