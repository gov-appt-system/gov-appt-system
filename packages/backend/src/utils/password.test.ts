import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validatePasswordComplexity } from './password';

/**
 * Property 1: Password complexity is consistent
 * Validates: Requirements 1.6, 5.4
 *
 * For any string, validatePasswordComplexity returns true if and only if
 * the string has ≥8 chars, contains upper and lower case letters, and contains a digit.
 */
describe('validatePasswordComplexity', () => {
  it('Property 1: complexity check is consistent with manual criteria', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 30 }), (password) => {
        const meetsLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasDigit = /[0-9]/.test(password);

        const expected = meetsLength && hasUpper && hasLower && hasDigit;
        const actual = validatePasswordComplexity(password);

        return actual === expected;
      }),
      { numRuns: 100 }
    );
  });
});
