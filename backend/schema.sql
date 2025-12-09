-- LearnLynk Tech Test - Task 1: Schema

-- Extension for gen_random_uuid in Supabase/Postgres
create extension if not exists "pgcrypto";

-- ============================================
-- LEADS TABLE
-- ============================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  owner_id uuid not null,          -- counselor/user who owns the lead
  team_id uuid,                    -- optional: team that owns the lead
  email text,
  phone text,
  full_name text,
  stage text not null default 'new',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries on leads
create index if not exists idx_leads_tenant_id
  on public.leads (tenant_id);

create index if not exists idx_leads_tenant_owner
  on public.leads (tenant_id, owner_id);

create index if not exists idx_leads_tenant_stage
  on public.leads (tenant_id, stage);

create index if not exists idx_leads_tenant_created_at
  on public.leads (tenant_id, created_at);


-- ============================================
-- APPLICATIONS TABLE
-- ============================================
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  lead_id uuid not null references public.leads(id) on delete cascade,
  program_id uuid,
  intake_id uuid,
  stage text not null default 'inquiry',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries on applications
create index if not exists idx_applications_tenant_id
  on public.applications (tenant_id);

create index if not exists idx_applications_tenant_lead
  on public.applications (tenant_id, lead_id);

create index if not exists idx_applications_tenant_status
  on public.applications (tenant_id, status);


-- ============================================
-- TASKS TABLE
-- ============================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  application_id uuid not null references public.applications(id) on delete cascade,
  title text,
  type text not null,              -- call | email | review
  status text not null default 'open',
  due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Only allow valid task types
  constraint chk_tasks_type
    check (type in ('call', 'email', 'review')),

  -- due_at must not be before created_at
  constraint chk_tasks_due_at_future
    check (due_at >= created_at)
);

-- Indexes for tasks:
-- - by tenant_id, due_at, status (for "tasks due today" per tenant)
create index if not exists idx_tasks_tenant_due_status
  on public.tasks (tenant_id, due_at, status);

-- Additional simple indexes (optional but helpful)
create index if not exists idx_tasks_tenant_id
  on public.tasks (tenant_id);

create index if not exists idx_tasks_application_id
  on public.tasks (application_id);
