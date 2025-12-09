-- LearnLynk Tech Test - Task 2: RLS Policies on leads

-- Enable RLS
alter table public.leads enable row level security;

-- Helper:
-- We use auth.jwt() which returns the JWT claims as jsonb.
-- JWT contains:
--   auth.jwt() ->> 'tenant_id'
--   auth.jwt() ->> 'user_id'
--   auth.jwt() ->> 'role'  -- 'admin' or 'counselor'


-- ============================================
-- SELECT POLICY
-- ============================================
-- Rules:
--  - Admins: can see ALL leads in their tenant.
--  - Counselors: can see
--      * leads where they are owner_id, OR
--      * leads where the lead is assigned to a team they belong to.
create policy "leads_select_policy"
on public.leads
for select
using (
  -- Tenant match is required
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
  AND
  (
    -- Admin sees everything for their tenant
    auth.jwt()->>'role' = 'admin'
    OR
    (
      -- Counselor rules
      auth.jwt()->>'role' = 'counselor'
      AND
      (
        -- Rule 1: They own the lead
        owner_id = (auth.jwt()->>'user_id')::uuid
        OR
        -- Rule 2: The lead belongs to a team they are part of
        EXISTS (
          SELECT 1
          FROM public.user_teams ut
          WHERE ut.user_id = (auth.jwt()->>'user_id')::uuid
            AND ut.team_id = public.leads.team_id
        )
      )
    )
  )
);


-- ============================================
-- INSERT POLICY
-- ============================================
-- Rules:
--  - Admins can insert leads for their tenant
--  - Counselors can insert leads only if owner_id = themselves
create policy "leads_insert_policy"
on public.leads
for insert
with check (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
  AND
  (
    auth.jwt()->>'role' = 'admin'
    OR
    (
      auth.jwt()->>'role' = 'counselor'
      AND owner_id = (auth.jwt()->>'user_id')::uuid
    )
  )
);
