import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock supabase before importing rbac
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { RBACController } from './rbac';
import { supabase } from '../config/supabase';
import { UserRole } from '../types';

// ============================================================
// Helpers
// ============================================================

/**
 * Builds a minimal chainable supabase mock that resolves at .single().
 */
function mockUserQuery(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'single'];
  methods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  (chain['single'] as ReturnType<typeof vi.fn>).mockResolvedValue(result);
  return chain;
}

// ============================================================
// Permission matrix: exhaustive expected values
// Derived directly from the design document.
// ============================================================

type Triple = { resource: string; action: string; role: UserRole; expected: boolean };

const ALL_ROLES = [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN];

/**
 * Builds the full set of (resource, action, role, expected) triples from
 * the design permission matrix. This is the ground truth for Property 6.
 */
function buildPermissionTriples(): Triple[] {
  const matrix: Record<string, Record<string, UserRole[]>> = {
    auth: {
      login:          [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN],
      logout:         [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN],
      register:       [UserRole.CLIENT],
      password_reset: [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN],
    },
    own_profile: {
      view:       [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN],
      edit:       [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN],
      deactivate: [UserRole.CLIENT],
    },
    appointments: {
      book:          [UserRole.CLIENT],
      view_own:      [UserRole.CLIENT],
      track:         [UserRole.CLIENT],
      view_queue:    [UserRole.STAFF, UserRole.MANAGER],
      update_status: [UserRole.STAFF, UserRole.MANAGER],
      cancel_own:    [UserRole.CLIENT],
    },
    services: {
      view:    [UserRole.CLIENT, UserRole.STAFF, UserRole.MANAGER],
      create:  [UserRole.MANAGER],
      edit:    [UserRole.MANAGER],
      archive: [UserRole.MANAGER],
    },
    staff_assignments: {
      assign: [UserRole.MANAGER],
      remove: [UserRole.MANAGER],
      view:   [UserRole.MANAGER],
    },
    user_accounts: {
      create_staff:        [UserRole.ADMIN],
      create_manager:      [UserRole.ADMIN],
      view_staff_managers: [UserRole.ADMIN],
      archive:             [UserRole.ADMIN],
      view_clients:        [UserRole.ADMIN],
      manage_clients:      [UserRole.ADMIN],
    },
    audit_logs: {
      view:   [UserRole.ADMIN],
      export: [UserRole.ADMIN],
    },
  };

  const triples: Triple[] = [];
  for (const resource of Object.keys(matrix)) {
    for (const action of Object.keys(matrix[resource])) {
      const allowedRoles = matrix[resource][action];
      for (const role of ALL_ROLES) {
        triples.push({ resource, action, role, expected: allowedRoles.includes(role) });
      }
    }
  }
  return triples;
}

const PERMISSION_TRIPLES = buildPermissionTriples();

// ============================================================
// Property 6: Permission matrix completeness
// ============================================================

/**
 * Property 6: Permission matrix completeness
 *
 * For every (role, resource, action) triple defined in the design matrix,
 * hasPermission returns the expected value.
 *
 * Validates: Requirements 1.3
 */
describe('RBACController — Property 6: Permission matrix completeness', () => {
  it('hasPermission matches the design matrix for every triple', () => {
    const rbac = new RBACController();

    fc.assert(
      fc.property(
        // Draw a random index into the full triples array
        fc.integer({ min: 0, max: PERMISSION_TRIPLES.length - 1 }),
        (idx) => {
          const { resource, action, role, expected } = PERMISSION_TRIPLES[idx];
          const result = rbac.hasPermission(role, resource, action);
          return result === expected;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('hasPermission covers all triples exhaustively', () => {
    // Non-property exhaustive check — every single triple must match
    const rbac = new RBACController();
    for (const { resource, action, role, expected } of PERMISSION_TRIPLES) {
      expect(rbac.hasPermission(role, resource, action)).toBe(expected);
    }
  });

  it('hasPermission returns false for unknown resource/action', () => {
    const rbac = new RBACController();

    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            resource: fc.constant('unknown_resource'),
            action: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          fc.record({
            resource: fc.string({ minLength: 1, maxLength: 20 }),
            action: fc.constant('unknown_action'),
          }),
        ),
        fc.constantFrom(...ALL_ROLES),
        ({ resource, action }, role) => {
          // Only test strings that are not real resources/actions
          const knownResources = ['auth', 'own_profile', 'appointments', 'services',
            'staff_assignments', 'user_accounts', 'audit_logs'];
          if (knownResources.includes(resource)) return true; // skip — not unknown
          return rbac.hasPermission(role, resource, action) === false;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Property 7: Archived users are denied
// ============================================================

/**
 * Property 7: Archived users are denied
 *
 * For any user with is_active = false OR archived_at set,
 * enforcePermission always throws a 403 regardless of resource/action.
 *
 * Validates: Requirements 1.3, 6.4
 */
describe('RBACController — Property 7: Archived users are denied', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 403 for inactive users (is_active = false) on any resource/action', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: PERMISSION_TRIPLES.length - 1 }),
        async (idx) => {
          const { resource, action } = PERMISSION_TRIPLES[idx];
          const rbac = new RBACController();

          const chain = mockUserQuery({
            data: { role: UserRole.ADMIN, is_active: false, archived_at: null },
            error: null,
          });
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(chain);

          await expect(
            rbac.enforcePermission('user-inactive', resource, action),
          ).rejects.toMatchObject({ statusCode: 403 });

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('throws 403 for archived users (archived_at set) on any resource/action', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: PERMISSION_TRIPLES.length - 1 }),
        fc.constantFrom(...ALL_ROLES),
        async (idx, role) => {
          const { resource, action } = PERMISSION_TRIPLES[idx];
          const rbac = new RBACController();

          const chain = mockUserQuery({
            data: { role, is_active: true, archived_at: '2024-01-01T00:00:00Z' },
            error: null,
          });
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(chain);

          await expect(
            rbac.enforcePermission('user-archived', resource, action),
          ).rejects.toMatchObject({ statusCode: 403 });

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('throws 403 for both inactive and archived users on any resource/action', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: PERMISSION_TRIPLES.length - 1 }),
        fc.constantFrom(...ALL_ROLES),
        async (idx, role) => {
          const { resource, action } = PERMISSION_TRIPLES[idx];
          const rbac = new RBACController();

          const chain = mockUserQuery({
            data: { role, is_active: false, archived_at: '2024-03-15T12:00:00Z' },
            error: null,
          });
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(chain);

          await expect(
            rbac.enforcePermission('user-both', resource, action),
          ).rejects.toMatchObject({ statusCode: 403 });

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('throws 403 when user is not found in DB', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: PERMISSION_TRIPLES.length - 1 }),
        async (idx) => {
          const { resource, action } = PERMISSION_TRIPLES[idx];
          const rbac = new RBACController();

          const chain = mockUserQuery({ data: null, error: { message: 'not found' } });
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(chain);

          await expect(
            rbac.enforcePermission('user-missing', resource, action),
          ).rejects.toMatchObject({ statusCode: 403 });

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('active users with correct role are allowed for permitted triples', async () => {
    // Sanity check: active users must NOT be denied for allowed actions
    const allowedTriples = PERMISSION_TRIPLES.filter((t) => t.expected);

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: allowedTriples.length - 1 }),
        async (idx) => {
          const { resource, action, role } = allowedTriples[idx];
          const rbac = new RBACController();

          const chain = mockUserQuery({
            data: { role, is_active: true, archived_at: null },
            error: null,
          });
          (supabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(chain);

          await expect(
            rbac.enforcePermission('user-active', resource, action),
          ).resolves.toBeUndefined();

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
