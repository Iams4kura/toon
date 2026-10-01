import type { ResolvedEncodeOptions } from '../src/types'
import type { TestCase } from './types'
import { describe, expect, it } from 'vitest'
import { decode, DEFAULT_DELIMITER, encode } from '../src/index'
import { loadFixtures } from './utils'

// Loaded via `JSON.parse`: a Vite JSON-to-literal transform would turn the
// prototype-safety fixtures' `__proto__` keys into prototype assignments.
const fixtureFiles = loadFixtures('encode', [
  'primitives',
  'objects',
  'objects-keyed',
  'arrays-primitive',
  'arrays-tabular',
  'arrays-nested',
  'arrays-objects',
  'delimiters',
  'whitespace',
])

for (const fixtures of fixtureFiles) {
  describe(fixtures.description, () => {
    for (const test of fixtures.tests) {
      it(test.name, () => {
        const resolvedOptions = resolveEncodeOptions(test.options)

        if (test.shouldError) {
          expect(() => encode(test.input, resolvedOptions))
            .toThrow()
        }
        else {
          const result = encode(test.input, resolvedOptions)
          expect(result).toBe(test.expected)
        }
      })
    }
  })
}

describe('root string quoting', () => {
  for (const [label, value] of [['\\uFEFF8', '\uFEFF8'], ['\\uFEFFabc', '\uFEFFabc'], ['\\uFEFF#x', '\uFEFF#x'], ['\\uFEFF', '\uFEFF']]) {
    it(`quotes "${label}" so the leading byte-order mark survives decoding`, () => {
      expect(encode(value)).toBe(`"${value}"`)
      expect(decode(encode(value))).toBe(value)
    })
  }

  it('leaves a field value starting with a byte-order mark unquoted', () => {
    expect(encode({ a: '\uFEFFx' })).toBe('a: \uFEFFx')
  })
})

function resolveEncodeOptions(options?: TestCase['options']): ResolvedEncodeOptions {
  return {
    indentSize: options?.indentSize ?? 2,
    delimiter: options?.delimiter ?? DEFAULT_DELIMITER,
  }
}
