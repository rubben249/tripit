-- Fase 5 — sharing a trip by QR / short code (docs/PLAN.md).
--
-- Supabase is only a short-lived mailbox here, never a copy of anyone's trips:
--   * the sharing device encrypts the trip on-device with a key derived from the short code and
--     uploads only the ciphertext, keyed by a SHA-256 hash of the code — the server never sees
--     the code, the key or the trip;
--   * a share lives 3 minutes; any number of devices can fetch it within that window (e.g. the
--     whole family at once), and expired rows are purged on every new share.
--
-- The table has RLS on and no policies, so clients can't read or list it at all — only these two
-- SECURITY DEFINER functions touch it, and fetching requires the exact code hash.

create table public.share_sessions (
  code_hash text primary key,
  payload text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.share_sessions enable row level security;

create or replace function public.create_share(p_code_hash text, p_payload text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expires_at timestamptz := now() + interval '3 minutes';
begin
  if p_code_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid code hash';
  end if;
  -- Free-tier guard rails against abuse of a public endpoint: one share is a single trip (photos
  -- included) — 8 MB is plenty — and at most a handful can be alive at once.
  if octet_length(p_payload) > 8 * 1024 * 1024 then
    raise exception 'share too large';
  end if;

  delete from share_sessions where expires_at < now();

  if (select count(*) from share_sessions) >= 50 then
    raise exception 'too many active shares, try again in a few minutes';
  end if;

  insert into share_sessions (code_hash, payload, expires_at)
  values (p_code_hash, p_payload, v_expires_at);

  return v_expires_at;
end;
$$;

create or replace function public.claim_share(p_code_hash text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select payload from share_sessions
  where code_hash = p_code_hash and expires_at > now();
$$;

-- Postgres grants EXECUTE to PUBLIC by default; grant exactly the roles the app uses
-- (see 20261005005512_revoke_public_check_allowed_email.sql for why this matters).
revoke execute on function public.create_share(text, text) from public;
revoke execute on function public.claim_share(text) from public;
grant execute on function public.create_share(text, text) to anon, authenticated;
grant execute on function public.claim_share(text) to anon, authenticated;
