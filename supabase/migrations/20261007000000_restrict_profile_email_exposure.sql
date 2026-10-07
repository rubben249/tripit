-- Security hardening (pre-production review): stop every signed-in member from
-- being able to read every other member's email address.
--
-- The original policy was `profiles_select_all_authenticated … using (true)`,
-- justified as a "member directory" for trip member lists and activity lines.
-- But `profiles` has an `email` column, so `select * from profiles` with
-- nothing but the (public) anon key plus any one invited account dumps the
-- email of everyone in the circle. And nothing in the app reads this table at
-- all yet — the directory it was opened up for does not exist, so the exposure
-- buys nothing today.
--
-- Least privilege instead: your own row, plus admins (who manage the invite
-- list and already see these addresses there). When a directory is actually
-- built, give it a view that selects only id/display_name/avatar_url rather
-- than reopening the whole table.

drop policy if exists "profiles_select_all_authenticated" on public.profiles;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());
