import type { Equal, Expect } from 'type-testing'
import { describe, expect, test } from 'vitest'
import type { FocusMode, FocusModeInquiry } from './focus.js'
import type { Answer, Inquiry } from '../visca/inquiry.js'

type AnswerForInquiry<I extends Inquiry<any>> = I extends Inquiry<infer P> ? Answer<P> : never

type test_FocusModeInquiry_answer = Expect<Equal<AnswerForInquiry<typeof FocusModeInquiry>, { mode: FocusMode }>>

describe('focus tests', () => {
	test('obligatory so vite sees one test was run', () => {
		expect(true).toBe(true)
	})
})
