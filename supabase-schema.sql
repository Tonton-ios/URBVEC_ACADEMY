create extension if not exists "pgcrypto";

-- Table pour les profils utilisateurs (lié à auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  is_admin boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fonction pour vérifier si l'utilisateur est admin sans récursion
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and is_admin = true
  );
end;
$$ language plpgsql security definer;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  price numeric not null default 0,
  status text not null default 'Brouillon',
  description text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_sections_course_position_idx
  on public.course_sections(course_id, position);

create index if not exists course_items_section_position_idx
  on public.course_items(section_id, position);

insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', true)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.course_items enable row level security;

drop policy if exists "Public can read published courses" on public.courses;
create policy "Public can read published courses"
on public.courses for select
using (status = 'Publié');

drop policy if exists "Public can read sections" on public.course_sections;
create policy "Public can read sections"
on public.course_sections for select
using (
  exists (
    select 1 from public.courses
    where courses.id = course_sections.course_id
    and courses.status = 'Publié' -- Only show sections for published courses
  )
);

drop policy if exists "Public can read course items" on public.course_items;
create policy "Public can read course items"
on public.course_items for select
using (
  exists (
    select 1 from public.courses
    where courses.id = course_items.course_id
    and courses.status = 'Publié' -- Only show items for published courses
  )
);

-- Politiques pour les profils
drop policy if exists "Les utilisateurs peuvent voir leur propre profil" on public.profiles;
create policy "Les utilisateurs peuvent voir leur propre profil"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Les admins peuvent voir tous les profils" on public.profiles;
create policy "Les admins peuvent voir tous les profils"
on public.profiles for select
using (public.is_admin());

-- Sécurisation des tables : seul un admin peut modifier les données
drop policy if exists "Prototype admin can manage courses" on public.courses;
create policy "Prototype admin can manage courses"
on public.courses for all
using (public.is_admin());

drop policy if exists "Prototype admin can manage sections" on public.course_sections;
create policy "Prototype admin can manage sections"
on public.course_sections for all
using (public.is_admin());

drop policy if exists "Prototype admin can manage items" on public.course_items;
create policy "Prototype admin can manage items"
on public.course_items for all
using (public.is_admin());

drop policy if exists "Public can read course files" on storage.objects;
create policy "Public can read course files"
on storage.objects for select
using (bucket_id = 'course-files');

drop policy if exists "Prototype admin can upload course files" on storage.objects;
create policy "Prototype admin can upload course files"
on storage.objects for insert
with check (
  bucket_id = 'course-files' AND
  public.is_admin()
);

-- Fonction pour créer un profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, is_admin)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', false);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
