import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ============================================================
// Mock supabase before importing audit module
// ============================================================

const insertMock = vi.fn();
const selectMock = vi.fn();

vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../config/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { AuditLogger } from './audit';
import { supabase } from '../config/supabase';

// ============================================================
// Helpers
// ============================================================

/** Arbitrary for non-empty trimmed strings (action, resource names). */
const arbNonEmptyString = fc.string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

/** Arbitrary for optional UUID-like user IDs. */
const arbUserId = fc.uuid();

/** Arbitrary for optional IP addresses. */
const arbIpAddress = fc.oneof(
  fc.ipV4(),
  fc.constant(undefined),
);

/** Arbitrary for a details JSONB object. */
const arbDetails = fc.oneof(
  fc.constant(undefined),
  fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
    fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
    { minKeys: 0, maxKeys: 5 },
  ),
);

/**
 * Builds a chainable supabase query mock for SELECT operations.
 * The chain supports: select → order → eq → gte → lte → then (resolves).
 */
function buildSelectChain(rows: Record<string, unknown>[]) {
  const result = { data: rows, error: null };
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Every method returns the chain itself, except the final resolution
  for (const method of ['select', 'order', 'eq', 'gte', 'lte']) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Make the chain thenable so `await query` resolves to result
  chain['then'] = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(result).then(resolve);
  });

  return chain;
}

/**
 * Builds a chainable supabase mock for INSERT operations.
 */
function buildInsertChain(error: unknown = null) {
  return {
    insert: vi.fn().mockResolvedValue({ error }),
  };
}

// ============================================================
// Property 10: Audit log immutability
//
// For any logged action, querying getAuditLogs always returns a
// record matching the logged action; no update or delete path exists.
//
// Validates: Requirements 9.2, 9.3
// ============================================================

describe('AuditLogger — Property 10: Audit log immutability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 10a: Round-trip — every logged user action is retrievable
   * via getAuditLogs with matching fields.
   *
   * For any (userId, action, resource, details, ipAddress), after
   * logUserAction succeeds, getAuditLogs returns a record whose
   * action, resource, userId, and details match the logged values.
   */
  it('logUserAction round-trip: logged entries are always retrievable via getAuditLogs', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUserId,
        arbNonEmptyString,
        arbNonEmptyString,
        arbDetails,
        arbIpAddress,
        async (userId, action, resource, details, ipAddress) => {
          vi.clearAllMocks();

          // --- INSERT phase ---
          const insertChain = buildInsertChain(null);
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(insertChain);

          await AuditLogger.logUserAction(userId, action, resource, details, ipAddress);

          // Verify insert was called with correct payload
          expect(insertChain.insert).toHaveBeenCalledOnce();
          const insertedRow = insertChain.insert.mock.calls[0][0];
          expect(insertedRow.user_id).toBe(userId);
          expect(insertedRow.action).toBe(action);
          expect(insertedRow.resource).toBe(resource);
          expect(insertedRow.details).toEqual(details ?? null);
          expect(insertedRow.ip_address).toBe(ipAddress ?? null);

          // --- SELECT phase ---
          // Simulate the DB returning the row that was just inserted
          const storedRow = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            user_id: userId,
            action,
            resource,
            details: details ?? null,
            ip_address: ipAddress ?? null,
          };

          const selectChain = buildSelectChain([storedRow]);
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

          const logs = await AuditLogger.getAuditLogs({ userId, action, resource });

          expect(logs.length).toBeGreaterThanOrEqual(1);
          const found = logs.find(
            (l) => l.action === action && l.resource === resource && l.userId === userId,
          );
          expect(found).toBeDefined();
          expect(found!.action).toBe(action);
          expect(found!.resource).toBe(resource);
          expect(found!.userId).toBe(userId);

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 10b: Round-trip — every logged system event is retrievable
   * via getAuditLogs with matching fields.
   */
  it('logSystemEvent round-trip: logged system events are always retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbNonEmptyString,
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 15 }).filter((s) => s.trim().length > 0),
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          { minKeys: 1, maxKeys: 4 },
        ),
        async (event, details) => {
          vi.clearAllMocks();

          // --- INSERT phase ---
          const insertChain = buildInsertChain(null);
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(insertChain);

          await AuditLogger.logSystemEvent(event, details);

          expect(insertChain.insert).toHaveBeenCalledOnce();
          const insertedRow = insertChain.insert.mock.calls[0][0];
          expect(insertedRow.user_id).toBeNull();
          expect(insertedRow.action).toBe(event);
          expect(insertedRow.resource).toBe('system');

          // --- SELECT phase ---
          const storedRow = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            user_id: null,
            action: event,
            resource: 'system',
            details,
            ip_address: null,
          };

          const selectChain = buildSelectChain([storedRow]);
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

          const logs = await AuditLogger.getAuditLogs({ action: event, resource: 'system' });

          expect(logs.length).toBeGreaterThanOrEqual(1);
          const found = logs.find((l) => l.action === event && l.resource === 'system');
          expect(found).toBeDefined();
          expect(found!.userId).toBeUndefined();

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 10c: Round-trip — every logged error is retrievable
   * via getAuditLogs with action='error' and resource='system'.
   */
  it('logError round-trip: logged errors are always retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 15 }).filter((s) => s.trim().length > 0),
          fc.string(),
          { minKeys: 0, maxKeys: 3 },
        ),
        async (errorMessage, context) => {
          vi.clearAllMocks();

          const error = new Error(errorMessage);

          // --- INSERT phase ---
          const insertChain = buildInsertChain(null);
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(insertChain);

          await AuditLogger.logError(error, context);

          expect(insertChain.insert).toHaveBeenCalledOnce();
          const insertedRow = insertChain.insert.mock.calls[0][0];
          expect(insertedRow.action).toBe('error');
          expect(insertedRow.resource).toBe('system');
          expect(insertedRow.details.message).toBe(errorMessage);

          // --- SELECT phase ---
          const storedRow = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            user_id: null,
            action: 'error',
            resource: 'system',
            details: { message: errorMessage, stack: error.stack, ...context },
            ip_address: null,
          };

          const selectChain = buildSelectChain([storedRow]);
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

          const logs = await AuditLogger.getAuditLogs({ action: 'error', resource: 'system' });

          expect(logs.length).toBeGreaterThanOrEqual(1);
          const found = logs.find((l) => l.action === 'error');
          expect(found).toBeDefined();
          expect(found!.details).toHaveProperty('message', errorMessage);

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 10d: No update or delete path exists on AuditLogger.
   *
   * The AuditLogger module exposes only insert and read operations.
   * There must be no method that could mutate or remove existing
   * audit log records.
   */
  it('AuditLogger exposes no update or delete methods', () => {
    const publicKeys = Object.keys(AuditLogger);

    // Allowed methods — all are insert or read operations
    const allowedMethods = new Set([
      'logUserAction',
      'logSystemEvent',
      'logError',
      'getAuditLogs',
      'exportAuditLogs',
    ]);

    // Forbidden patterns — any method that could mutate/delete records
    const forbiddenPatterns = [
      /update/i,
      /delete/i,
      /remove/i,
      /edit/i,
      /modify/i,
      /patch/i,
      /purge/i,
      /truncate/i,
      /drop/i,
      /clear/i,
    ];

    for (const key of publicKeys) {
      // Every public key must be in the allowed set
      expect(allowedMethods.has(key)).toBe(true);

      // No public key should match forbidden patterns
      for (const pattern of forbiddenPatterns) {
        expect(pattern.test(key)).toBe(false);
      }
    }
  });

  /**
   * Property 10e: Insert failures do not throw — audit logging is
   * fire-and-forget to avoid breaking callers.
   *
   * For any input, if the DB insert fails, logUserAction still
   * resolves without throwing.
   */
  it('logUserAction swallows insert errors without throwing', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUserId,
        arbNonEmptyString,
        arbNonEmptyString,
        async (userId, action, resource) => {
          vi.clearAllMocks();

          const insertChain = buildInsertChain({ message: 'DB connection lost' });
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(insertChain);

          // Must not throw
          await expect(
            AuditLogger.logUserAction(userId, action, resource),
          ).resolves.toBeUndefined();

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 10f: getAuditLogs applies all provided filters to the query.
   *
   * For any combination of filters, the supabase query chain receives
   * the correct filter calls.
   */
  it('getAuditLogs applies all provided filters correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.option(arbUserId, { nil: undefined }),
          action: fc.option(arbNonEmptyString, { nil: undefined }),
          resource: fc.option(arbNonEmptyString, { nil: undefined }),
          startDate: fc.option(
            fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') }),
            { nil: undefined },
          ),
          endDate: fc.option(
            fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') }),
            { nil: undefined },
          ),
        }),
        async (filters) => {
          vi.clearAllMocks();

          const selectChain = buildSelectChain([]);
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(selectChain);

          await AuditLogger.getAuditLogs(filters);

          // Verify supabase.from was called with 'audit_logs'
          expect(supabase.from).toHaveBeenCalledWith('audit_logs');

          // Verify select and order were called
          expect(selectChain.select).toHaveBeenCalledWith('*');
          expect(selectChain.order).toHaveBeenCalledWith('timestamp', { ascending: false });

          // Count expected filter calls
          let expectedEqCalls = 0;
          if (filters.userId)    expectedEqCalls++;
          if (filters.action)    expectedEqCalls++;
          if (filters.resource)  expectedEqCalls++;

          expect(selectChain.eq).toHaveBeenCalledTimes(expectedEqCalls);

          if (filters.startDate) {
            expect(selectChain.gte).toHaveBeenCalledWith('timestamp', filters.startDate.toISOString());
          } else {
            expect(selectChain.gte).not.toHaveBeenCalled();
          }

          if (filters.endDate) {
            expect(selectChain.lte).toHaveBeenCalledWith('timestamp', filters.endDate.toISOString());
          } else {
            expect(selectChain.lte).not.toHaveBeenCalled();
          }

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
