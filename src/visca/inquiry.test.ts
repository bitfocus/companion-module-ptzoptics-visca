import type { Equal, Expect } from 'type-testing'
import { describe, expect, test } from 'vitest'
import { OnScreenDisplayInquiry } from '../camera/osd.js'
import { type Answer, type Inquiry, ModuleDefinedInquiry, UserDefinedInquiry } from './inquiry.js'

type AnswerForInquiry<I extends Inquiry<any>> = I extends Inquiry<infer P> ? Answer<P> : never

const _InquiryNoParams = new ModuleDefinedInquiry([0x81, 0x12, 0x34, 0xff], {
	bytes: [0x90, 0x50, 0x00, 0xff],
	params: {},
})

type assert_NoParams_answer = Expect<
	Equal<
		// answer type with no parameters will be empty
		keyof AnswerForInquiry<typeof _InquiryNoParams>,
		never
	>
>

type AutoOrManual = 'auto' | 'manual'

const _InquiryOneTypedParam = new ModuleDefinedInquiry([0x81, 0x09, 0x04, 0x38, 0xff], {
	bytes: [0x90, 0x50, 0x00, 0xff],
	params: {
		mode: {
			nibbles: [5],
			convert: (param: number): AutoOrManual => {
				switch (param) {
					default:
					case 2:
						return 'auto'
					case 3:
						return 'manual'
				}
			},
		},
	},
})

type assert_InquiryOneTypedParam_answer = Expect<
	Equal<
		// answer type with one typed parameter
		AnswerForInquiry<typeof _InquiryOneTypedParam>,
		{ mode: AutoOrManual }
	>
>

const _InquiryOneNumericParam = new ModuleDefinedInquiry([0x81, 0x09, 0x04, 0x38, 0xff], {
	bytes: [0x90, 0x50, 0x00, 0xff],
	params: {
		n: {
			nibbles: [5],
		},
	},
})

type assert_InquiryOneNumericParam_answer = Expect<
	Equal<
		// answer type with one parameter implicitly numeric
		AnswerForInquiry<typeof _InquiryOneNumericParam>,
		{ n: number }
	>
>

describe('isUserDefined function', () => {
	test('module-defined command is not user-defined', () => {
		const mdi = new ModuleDefinedInquiry([0x81, 0x12, 0x34, 0xff], {
			bytes: [0x90, 0x50, 0x00, 0xff],
			params: {},
		})
		expect(mdi.isUserDefined()).toBe(false)
	})
	test('user-defined command is user-defined', () => {
		const udc = new UserDefinedInquiry([0x81, 0x12, 0x34, 0xff], {
			bytes: [0x90, 0x50, 0x00, 0xff],
			params: {
				n: {
					nibbles: [5],
				},
			},
		})
		expect(udc.isUserDefined()).toBe(true)
	})

	test('OSD inquiry is not user-defined', () => {
		expect(OnScreenDisplayInquiry.isUserDefined()).toBe(false)
	})
})
