begin;
create table public.alivio_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 80),
 email text not null,
 age integer not null check (age between 18 and 120),
 initial_weight numeric not null check (initial_weight between 30 and 400),
 target_loss numeric not null check (target_loss >= 0 and target_loss < initial_weight),
 goals text[] not null default '{}', prefs text[] not null default '{}', restr text[] not null default '{}'
);
create table public.alivio_weights (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 weight numeric not null check (weight between 30 and 400),
 recorded_on date not null default current_date,
 unique(user_id, recorded_on)
);
alter table public.alivio_profiles enable row level security;
alter table public.alivio_weights enable row level security;
revoke all on public.alivio_profiles, public.alivio_weights from anon;
grant select, insert, update, delete on public.alivio_profiles, public.alivio_weights to authenticated;
create policy "Own profile" on public.alivio_profiles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and email = (select auth.jwt()->>'email'));
create policy "Own weights" on public.alivio_weights for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('alivio-progress', 'alivio-progress', false, 8388608, array['image/jpeg','image/png','image/webp']);
create policy "Own progress photos read" on storage.objects for select to authenticated using (bucket_id = 'alivio-progress' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own progress photos upload" on storage.objects for insert to authenticated with check (bucket_id = 'alivio-progress' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own progress photos delete" on storage.objects for delete to authenticated using (bucket_id = 'alivio-progress' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;
