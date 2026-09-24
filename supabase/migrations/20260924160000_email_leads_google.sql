begin;
-- Email is contact information, never an authentication or ownership key.
create table public.alivio_contacts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 created_at timestamptz not null default now()
);
alter table public.alivio_contacts enable row level security;
revoke all on public.alivio_contacts from anon, authenticated;
grant select on public.alivio_contacts to authenticated;
create policy "Read own contact" on public.alivio_contacts for select to authenticated using ((select auth.uid()) = user_id);
create function public.alivio_capture_contact() returns trigger
language plpgsql security definer set search_path = '' as $$
declare contact_email text;
begin
 contact_email := coalesce(nullif(new.email, ''), new.raw_user_meta_data->>'lead_email');
 if contact_email is not null and char_length(contact_email) <= 254 and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
  insert into public.alivio_contacts(user_id,email) values(new.id,contact_email)
  on conflict(user_id) do update set email = excluded.email;
 end if;
 return new;
end;
$$;
revoke all on function public.alivio_capture_contact() from public, anon, authenticated;
create trigger alivio_capture_contact after insert or update of email on auth.users
for each row execute function public.alivio_capture_contact();
insert into public.alivio_contacts(user_id,email)
select id,email from auth.users where email is not null and char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
on conflict(user_id) do nothing;
drop policy "Own profile" on public.alivio_profiles;
create policy "Own profile" on public.alivio_profiles for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and email = (select c.email from public.alivio_contacts c where c.user_id = (select auth.uid())));
commit;
