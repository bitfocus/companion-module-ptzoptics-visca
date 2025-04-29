/** A shorthand for `Readonly<Record<...>>`. */
export type ReadonlyRecord<K extends keyof any, V> = Readonly<Record<K, V>>
