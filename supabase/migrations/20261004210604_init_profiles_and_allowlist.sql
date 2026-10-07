-- Fase 1 — cimientos: profiles + closed-signup allowlist.
-- See docs/PLAN.md section 4 ("Modelo de datos") and docs/REQUISITOS.md section 10.

-- One row per authenticated user, created automatically on signup (trigger below).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- The closed-signup allowlist the admin manages. Never readable by regular
-- users (that would leak who else is invited) — only admins, via RLS below,
-- and the before-user-created Auth Hook (runs as the function owner, bypasses
-- RLS) which is the actual gate that blocks signup for non-listed emails.
create table public.allowed_emails (
  email text primary key,
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  used_at timestamptz
);

alter table public.allowed_emails enable row level security;

-- SECURITY DEFINER so RLS policies can check "is this user an admin" without
-- recursively evaluating the profiles RLS policy against itself.
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- email/is_admin are immutable from the client: a user can rename themselves
-- or change their avatar, but never grant themselves admin or hijack another
-- profile's email. Only service_role (server-side tooling) bypasses this.
create function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.email := old.email;
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger protect_profile_fields
  before update on public.profiles
  for each row
  execute function public.protect_profile_fields();

-- Creates the profiles row the moment Supabase Auth creates the user, and
-- marks the matching allowlist entry as used.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  update public.allowed_emails
  set used_at = now()
  where email = new.email and used_at is null;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Auth Hook: the actual closed-signup gate, invoked by Supabase Auth itself
-- BEFORE the user row is created — this is what makes "no open signup" true,
-- not just an RLS policy. Registered in supabase/config.toml under
-- [auth.hook.before_user_created].
--
-- Verified against the real project: requesting an OTP for an email that is not
-- in allowed_emails returns 403 "This app is invite-only...". Note the hook has
-- to be registered by hand in the dashboard (Authentication -> Hooks) — it is
-- platform config, not something SQL or the CLI can deploy, so a restored or
-- re-created project needs that step repeated or the gate is silently open.
create function public.check_allowed_email(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_email text := event -> 'user' ->> 'email';
begin
  if candidate_email is null or not exists (
    select 1 from public.allowed_emails where email = lower(candidate_email)
  ) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'This app is invite-only. Ask an admin to add your email first.'
      )
    );
  end if;

  return jsonb_build_object();
end;
$$;

revoke execute on function public.check_allowed_email from authenticated, anon;
grant execute on function public.check_allowed_email to supabase_auth_admin;

-- profiles RLS: any signed-in circle member can see the member directory
-- (needed for trip member lists and activity like "Ana added an expense"),
-- but can only ever update their own row.
create policy "profiles_select_all_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- allowed_emails RLS: admins only. The signup gate itself is the Auth Hook
-- above (runs with definer privileges, bypasses RLS) — regular users and
-- anon never see or touch this table directly.
create policy "allowed_emails_admin_all"
  on public.allowed_emails for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
