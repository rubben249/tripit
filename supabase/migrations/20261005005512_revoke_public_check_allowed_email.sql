-- Fixes from the Fase 1 independent code review.

-- 1) SECURITY FIX (critical): Postgres grants EXECUTE on new functions to
-- PUBLIC by default. The original migration only revoked from
-- authenticated/anon, which did nothing — both still had access through the
-- standing PUBLIC grant, letting any client with the anon key call
-- check_allowed_email directly and probe whether an arbitrary email is on
-- the private invite list. This is the actual fix Supabase's own Auth Hooks
-- docs use for this exact pattern.
revoke execute on function public.check_allowed_email from public;

-- Explicit schema usage grant for the hook's execution role, matching the
-- documented pattern — defensive, in case it wasn't already implicit.
grant usage on schema public to supabase_auth_admin;

-- 2) Email case-sensitivity fix: check_allowed_email lowercases the
-- incoming email before comparing, but allowed_emails itself was never
-- constrained to lowercase, and handle_new_user's "mark as used" update
-- compared without lower() on either side. An admin pasting "John@x.com"
-- would silently never match a real signup. Normalize existing rows and
-- enforce lowercase going forward.
update public.allowed_emails set email = lower(email) where email <> lower(email);

alter table public.allowed_emails
  add constraint allowed_emails_email_lowercase check (email = lower(email));

create or replace function public.handle_new_user()
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
  where email = lower(new.email) and used_at is null;

  return new;
end;
$$;
