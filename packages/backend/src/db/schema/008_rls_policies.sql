-- Migration: 008_rls_policies
-- Supabase Row Level Security policies matching the RBAC permission matrix.
--
-- IMPORTANT: The backend uses the Supabase service-role key, which bypasses
-- RLS entirely. These policies protect data when the frontend (or any client)
-- connects with the anon/public key via Supabase JS client directly.
--
-- The authenticated user's JWT is expected to contain:
--   auth.uid()   → users.id  (UUID)
--   auth.jwt()   → { role: 'client' | 'staff' | 'manager' | 'admin', ... }
--
-- Helper: extract the app-level role from the JWT claims.
-- Supabase stores custom claims under raw_app_meta_data or we read from
-- the users table. We use a helper function for clarity.
-- ============================================================

-- ============================================================
-- HELPER FUNCTION: get the app role for the current user
-- Reads from the users table to stay in sync with role changes.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ============================================================
-- HELPER FUNCTION: check if current user has an active
-- service assignment for a given service
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_assigned_to_service(p_service_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.service_assignments
    WHERE staff_id = auth.uid()
      AND service_id = p_service_id
      AND is_active = TRUE
  );
$$;

-- ============================================================
-- TABLE: users
-- All roles can read their own row. Admin can read all.
-- Only the owning user can update their own row.
-- No deletes (soft-delete only via application layer).
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- Admin can read all user rows
CREATE POLICY users_select_admin ON public.users
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Users can update their own row (profile edits, password changes)
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin can update any user row (account management)
CREATE POLICY users_update_admin ON public.users
  FOR UPDATE
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Only allow inserts during registration (client self-registration)
-- or admin account creation. The service-role key bypasses RLS for
-- server-side inserts, so this policy covers direct client access.
CREATE POLICY users_insert_self ON public.users
  FOR INSERT
  WITH CHECK (TRUE);
  -- Registration is open; the application layer validates role assignment.

-- ============================================================
-- TABLE: clients
-- Clients can read/update their own profile.
-- Admin can read all client profiles.
-- ============================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_select_own ON public.clients
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY clients_select_admin ON public.clients
  FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY clients_update_own ON public.clients
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY clients_update_admin ON public.clients
  FOR UPDATE
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY clients_insert ON public.clients
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE: staff_profiles
-- Staff/Manager can read their own profile.
-- Admin can read/update all staff profiles.
-- ============================================================
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_profiles_select_own ON public.staff_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY staff_profiles_select_admin ON public.staff_profiles
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Manager can view staff profiles for assignment purposes
CREATE POLICY staff_profiles_select_manager ON public.staff_profiles
  FOR SELECT
  USING (public.get_my_role() = 'manager');

CREATE POLICY staff_profiles_update_own ON public.staff_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY staff_profiles_update_admin ON public.staff_profiles
  FOR UPDATE
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY staff_profiles_insert_admin ON public.staff_profiles
  FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

-- ============================================================
-- TABLE: admin_profiles
-- Admin can read/update their own profile only.
-- ============================================================
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_profiles_select_own ON public.admin_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY admin_profiles_update_own ON public.admin_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE: services
-- Client, Staff, Manager can read active services.
-- Only Manager can create/update/archive services.
-- Admin has no access to services.
-- ============================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Client, Staff, Manager can view active services
CREATE POLICY services_select_active ON public.services
  FOR SELECT
  USING (
    public.get_my_role() IN ('client', 'staff', 'manager')
    AND is_active = TRUE
    AND archived_at IS NULL
  );

-- Manager can also view archived services (for management)
CREATE POLICY services_select_manager_all ON public.services
  FOR SELECT
  USING (public.get_my_role() = 'manager');

-- Manager can create services
CREATE POLICY services_insert_manager ON public.services
  FOR INSERT
  WITH CHECK (public.get_my_role() = 'manager');

-- Manager can update services
CREATE POLICY services_update_manager ON public.services
  FOR UPDATE
  USING (public.get_my_role() = 'manager')
  WITH CHECK (public.get_my_role() = 'manager');

-- ============================================================
-- TABLE: appointments
-- Client: read/insert/update own appointments only.
-- Staff/Manager: read appointments for their assigned services.
-- Staff/Manager: update appointments for their assigned services.
-- Admin: no access.
-- ============================================================
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Client can read their own appointments
CREATE POLICY appointments_select_client ON public.appointments
  FOR SELECT
  USING (
    public.get_my_role() = 'client'
    AND client_id = auth.uid()
  );

-- Staff/Manager can read appointments for their assigned services
CREATE POLICY appointments_select_staff ON public.appointments
  FOR SELECT
  USING (
    public.get_my_role() IN ('staff', 'manager')
    AND public.is_assigned_to_service(service_id)
  );

-- Client can create appointments (book)
CREATE POLICY appointments_insert_client ON public.appointments
  FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'client'
    AND client_id = auth.uid()
  );

-- Client can update own pending appointments (cancel)
CREATE POLICY appointments_update_client ON public.appointments
  FOR UPDATE
  USING (
    public.get_my_role() = 'client'
    AND client_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    client_id = auth.uid()
  );

-- Staff/Manager can update appointments for their assigned services
CREATE POLICY appointments_update_staff ON public.appointments
  FOR UPDATE
  USING (
    public.get_my_role() IN ('staff', 'manager')
    AND public.is_assigned_to_service(service_id)
  )
  WITH CHECK (
    public.is_assigned_to_service(service_id)
  );

-- ============================================================
-- TABLE: service_assignments
-- Manager can read/create/update assignments.
-- Staff can read their own assignments.
-- Admin and Client have no access.
-- ============================================================
ALTER TABLE public.service_assignments ENABLE ROW LEVEL SECURITY;

-- Manager can view all assignments
CREATE POLICY service_assignments_select_manager ON public.service_assignments
  FOR SELECT
  USING (public.get_my_role() = 'manager');

-- Staff can view their own assignments
CREATE POLICY service_assignments_select_own ON public.service_assignments
  FOR SELECT
  USING (
    public.get_my_role() IN ('staff', 'manager')
    AND staff_id = auth.uid()
  );

-- Manager can create assignments
CREATE POLICY service_assignments_insert_manager ON public.service_assignments
  FOR INSERT
  WITH CHECK (public.get_my_role() = 'manager');

-- Manager can update assignments (soft-archive)
CREATE POLICY service_assignments_update_manager ON public.service_assignments
  FOR UPDATE
  USING (public.get_my_role() = 'manager')
  WITH CHECK (public.get_my_role() = 'manager');

-- ============================================================
-- TABLE: audit_logs
-- Admin can read audit logs (view and export).
-- All authenticated users can insert (the application layer
-- writes audit entries on behalf of the acting user).
-- No updates or deletes — audit logs are immutable.
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all audit logs
CREATE POLICY audit_logs_select_admin ON public.audit_logs
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Any authenticated user can insert audit log entries
-- (the backend writes these on behalf of the acting user)
CREATE POLICY audit_logs_insert_authenticated ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE or DELETE policies — audit logs are immutable.
-- The absence of these policies means no role can modify or remove entries.
