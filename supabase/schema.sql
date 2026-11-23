-- ============================================================================
-- Portfolio backend: run this ONCE in Supabase  (Dashboard > SQL Editor > New query)
--
-- Before you run it:
--   1. Replace 'your.email@example.com' below with the email of YOUR Supabase user
--      (create it in Authentication > Users > Add user, tick "Auto Confirm User").
--   2. In Authentication > Providers > Email, turn OFF "Allow new users to sign up".
--
-- What it creates
--   certificates   metadata for each certificate (public read, owner write)
--   skill_levels   your editable proficiency numbers (public read, owner write)
--   certificates   storage bucket for the PDF / JPG / PNG files and thumbnails
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

-- ---- who is the owner? -------------------------------------------------------
create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') = 'your.email@example.com', false);
$$;

-- ---- certificates ------------------------------------------------------------
create table if not exists public.certificates (
  id             uuid primary key,
  title          text not null check (char_length(title) between 1 and 140),
  issuer         text not null check (char_length(issuer) between 1 and 120),
  issue_date     date not null,
  category       text not null check (category in (
                   'Machine Learning', 'Deep Learning', 'Generative AI', 'Data Science',
                   'Programming', 'Cloud Computing', 'Professional Development')),
  credential_id  text,
  credential_url text check (credential_url is null or credential_url ~* '^https?://'),
  skills         text[] not null default '{}',
  description    text,
  file_path      text not null,
  file_name      text,
  file_type      text not null check (file_type in ('application/pdf', 'image/jpeg', 'image/png')),
  file_size      bigint,
  thumb_path     text,
  created_at     timestamptz not null default now()
);

alter table public.certificates enable row level security;

drop policy if exists "certificates are public"      on public.certificates;
drop policy if exists "owner adds certificates"      on public.certificates;
drop policy if exists "owner edits certificates"     on public.certificates;
drop policy if exists "owner deletes certificates"   on public.certificates;

create policy "certificates are public"    on public.certificates for select using (true);
create policy "owner adds certificates"    on public.certificates for insert with check (public.is_owner());
create policy "owner edits certificates"   on public.certificates for update using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes certificates" on public.certificates for delete using (public.is_owner());

-- ---- skill levels ------------------------------------------------------------
create table if not exists public.skill_levels (
  skill_id   text primary key,
  level      integer not null check (level between 0 and 100),
  updated_at timestamptz not null default now()
);

alter table public.skill_levels enable row level security;

drop policy if exists "levels are public"   on public.skill_levels;
drop policy if exists "owner adds levels"   on public.skill_levels;
drop policy if exists "owner edits levels"  on public.skill_levels;
drop policy if exists "owner deletes levels" on public.skill_levels;

create policy "levels are public"    on public.skill_levels for select using (true);
create policy "owner adds levels"    on public.skill_levels for insert with check (public.is_owner());
create policy "owner edits levels"   on public.skill_levels for update using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes levels" on public.skill_levels for delete using (public.is_owner());

-- ---- storage bucket ----------------------------------------------------------
-- Public bucket: anyone with a file's URL can open it (that is what a public gallery needs).
-- 10 MB limit and file-type allow-list are enforced by the bucket itself.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificates', 'certificates', true, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "certificate files are public"    on storage.objects;
drop policy if exists "owner uploads certificate files" on storage.objects;
drop policy if exists "owner edits certificate files"   on storage.objects;
drop policy if exists "owner deletes certificate files" on storage.objects;

create policy "certificate files are public"    on storage.objects for select using (bucket_id = 'certificates');
create policy "owner uploads certificate files" on storage.objects for insert with check (bucket_id = 'certificates' and public.is_owner());
create policy "owner edits certificate files"   on storage.objects for update using (bucket_id = 'certificates' and public.is_owner());
create policy "owner deletes certificate files" on storage.objects for delete using (bucket_id = 'certificates' and public.is_owner());
