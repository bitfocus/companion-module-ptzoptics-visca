import type { CompanionOptionValues } from '@companion-module/base'

export type GetSemantic<S> = (options: CompanionOptionValues) => S

export type SemanticToOption<S, Id extends string> = (semantic: S) => CompanionOptionValues[Id]

/**
 * Generate functions to compute, from action options including the option
 * `optionId` and a complete option-value-to-semantic-value mapping, the
 * semantic value for any option and the option value for any semantic value,
 * falling back on supplied values in cases where no mapping was defined.
 *
 * @param optionId
 *    The option name.
 * @param choiceToSemantic
 *    An array of option value to semantic value pairings.
 * @param choiceToSemanticFallback
 *    The fallback semantic value to return if the option value isn't mapped in
 *    `choiceToSemantic`.
 * @param semanticToChoiceFallback
 *    The fallback option value to return if the semantic value isn't mapped in
 *    `choiceToSemantic`.
 * @param convert
 *    An optional conversion to apply to the requested option's value before
 *    mapping it to a semantic value.  (This is intended for generally-mild
 *    sanitization of existing options, for example converting options stored as
 *    string to the identical number and such.)
 * @returns
 *    A tuple of a function accepting an `options` object
 */
export function optionConversions<S, Id extends string>(
	optionId: Id,
	choiceToSemantic: readonly (readonly [CompanionOptionValues[Id], S])[],
	choiceToSemanticFallback: S,
	semanticToChoiceFallback: CompanionOptionValues[Id],
	convert?: (optionValue: CompanionOptionValues[Id]) => CompanionOptionValues[Id],
): [GetSemantic<S>, SemanticToOption<S, Id>] {
	const [choiceToSemanticMap, semanticToChoiceMap] = choiceToSemantic.reduce(
		([choiceToSemanticMap, semanticToChoiceMap], [choice, semantic]) => {
			choiceToSemanticMap.set(choice, semantic)
			semanticToChoiceMap.set(semantic, choice)
			return [choiceToSemanticMap, semanticToChoiceMap]
		},
		[new Map(), new Map()],
	)

	function getSemantic(options: CompanionOptionValues): S {
		let opt = options[optionId]
		if (convert) {
			opt = convert(opt)
		}
		return choiceToSemanticMap.get(opt) ?? choiceToSemanticFallback
	}

	function semanticToOption(semantic: S): CompanionOptionValues[Id] {
		return semanticToChoiceMap.get(semantic) ?? semanticToChoiceFallback
	}

	return [getSemantic, semanticToOption]
}

/**
 * Generate functions to compute, for an action option whose values are the same
 * as those of a corresponding semantic type, the semantic value for any option
 * and the option value for any semantic value, using the fallback value in
 * cases where no mapping was defined.
 *
 * @param optionId
 *    The option name.
 * @param choices
 *    A list of values acceptable as both an option value and a semantic value.
 * @param fallback
 *    The fallback value to return when an option or semantic value isn't
 *    mapped.
 * @param convert
 *    An optional conversion to apply to the requested option's value before
 *    mapping it to a semantic value.  (This is intended for generally-mild
 *    sanitization of existing options, for example converting options stored as
 *    string to the identical number and such.)
 * @returns
 *    A tuple of a function accepting an `options` object
 */
export function optionNullConversions<S extends CompanionOptionValues[Id], Id extends string>(
	optionId: Id,
	choices: readonly S[],
	fallback: S,
	convert?: (optionValue: CompanionOptionValues[Id]) => CompanionOptionValues[Id],
): [GetSemantic<S>, SemanticToOption<S, Id>] {
	const choiceSet = new Set(choices)

	function getSemantic(options: CompanionOptionValues): S {
		const opt = options[optionId]
		const value = (convert ? convert(opt) : opt) as S
		return choiceSet.has(value) ? value : fallback
	}

	function semanticToOption(semantic: S): CompanionOptionValues[Id] {
		return choiceSet.has(semantic) ? semantic : fallback
	}

	return [getSemantic, semanticToOption]
}
