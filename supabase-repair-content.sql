-- URBVEC Academy — réparation durable du contenu de cours.
-- À exécuter UNE FOIS dans Supabase > SQL Editor, connecté comme propriétaire du projet.
-- Cette migration préserve les contenus valides et retire seulement les éléments orphelins.

begin;

create extension if not exists "pgcrypto";

create table if not exists public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_items (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_id uuid not null references public.course_sections(id) on delete cascade,
  title text not null,
  type text not null default 'document',
  url text default '',
  note text default '',
  file_name text default '',
  deadline_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Corrige les anciennes lignes dont course_id ne correspondait pas à leur section.
update public.course_items item
set course_id = section.course_id
from public.course_sections section
where item.section_id = section.id
  and item.course_id is distinct from section.course_id;

-- Une ligne sans section ne peut jamais être affichée : elle empêchait les sauvegardes.
delete from public.course_items item
where not exists (select 1 from public.course_sections section where section.id = item.section_id);

create unique index if not exists course_sections_id_course_id_uidx
  on public.course_sections(id, course_id);

alter table public.course_items
  drop constraint if exists course_items_section_id_fkey,
  drop constraint if exists course_items_section_course_fkey;

alter table public.course_items
  add constraint course_items_section_course_fkey
  foreign key (section_id, course_id)
  references public.course_sections(id, course_id)
  on delete cascade;

create index if not exists course_sections_course_position_idx
  on public.course_sections(course_id, position);
create index if not exists course_items_section_position_idx
  on public.course_items(section_id, position);

alter table public.course_sections enable row level security;
alter table public.course_items enable row level security;

drop policy if exists "Public can read sections" on public.course_sections;
create policy "Public can read sections" on public.course_sections for select
using (public.can_access_course(course_id));

drop policy if exists "Public can read course items" on public.course_items;
create policy "Public can read course items" on public.course_items for select
using (public.can_access_course(course_id));

drop policy if exists "Prototype admin can manage sections" on public.course_sections;
create policy "Prototype admin can manage sections" on public.course_sections for all
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Prototype admin can manage items" on public.course_items;
create policy "Prototype admin can manage items" on public.course_items for all
using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', true)
on conflict (id) do nothing;

drop policy if exists "Public can read course files" on storage.objects;
create policy "Public can read course files" on storage.objects for select
using (bucket_id = 'course-files');

drop policy if exists "Admins can manage course files" on storage.objects;
create policy "Admins can manage course files" on storage.objects for all
using (bucket_id = 'course-files' and public.is_admin())
with check (bucket_id = 'course-files' and public.is_admin());

commit;

-- Après exécution, active ton compte administrateur (remplace l'adresse) :
-- update public.profiles set is_admin = true where email = 'ton-email@domaine.com';
