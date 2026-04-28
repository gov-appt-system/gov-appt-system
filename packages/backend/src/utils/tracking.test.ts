import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateTrackingNumber, validateTrackingNumber } from './tracking';

/**
 * Property 2: Tracking numbers are unique
 * Validates: Requirement 2.4
 *
 * For any N calls to generateTrackingNumber, all N results are distinct.
 */
describe('generateTrackingNumber', () => {
  it('Property 2: N generated tracking numbers are all distinct', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (n) => {
          const numbers: string[] = [];
          for (let i = 0; i < n; i++) {
            numbers.push(generateTrackingNumber());
          }
          const unique = new Set(numbers);
          return unique.size === numbers.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Tracking number format
   * Validates: Requirement 2.4
   *
   * For any generated tracking number, validateTrackingNumber returns true.
   */
  it('Property 3: every generated tracking number passes format validation', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // no input needed — generator is side-effectful
        () => {
          const trackingNumber = generateTrackingNumber();
          return validateTrackingNumber(trackingNumber);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Additional structural validation: validateTrackingNumber rejects
 * arbitrary strings that don't match the APT-YYYYMMDD-XXXXX format.
 */
describe('validateTrackingNumber', () => {
  it('rejects arbitrary strings that are not valid tracking numbers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 30 }),
        (s) => {
          // If the string happens to match the format, validation should pass;
          // otherwise it must fail. This is a tautology check that the regex
          // agrees with itself, but it guards against accidental regressions.
          const matchesFormat = /^APT-\d{8}-[A-Z0-9]{5}$/.test(s);
          return validateTrackingNumber(s) === matchesFormat;
        }
      ),
      { numRuns: 100 }
    );
  });
});
