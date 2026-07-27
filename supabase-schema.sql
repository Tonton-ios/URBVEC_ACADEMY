create extension if not exists "pgcrypto";

-- Table pour les profils utilisateurs (lié à auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  phone text default '',
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

create table if not exists public.student_courses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  status text not null default 'Actif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, course_id)
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
  deadline_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_id uuid references public.course_sections(id) on delete set null,
  title text not null,
  instructions text default '',
  opens_at timestamptz,
  closes_at timestamptz,
  time_limit_minutes integer default 0,
  shuffle_questions boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.course_quizzes(id) on delete cascade,
  question text not null,
  explanation text default '',
  points numeric not null default 1,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.course_quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score numeric not null default 0,
  total_points numeric not null default 0,
  submitted_at timestamptz not null default now(),
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_option_id uuid references public.quiz_options(id) on delete set null,
  is_correct boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_id uuid references public.course_sections(id) on delete set null,
  title text not null,
  description text default '',
  instructions text default '',
  deadline_at timestamptz,
  max_score numeric default 20,
  allow_file_upload boolean default true,
  allow_link_submission boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  submitted_text text default '',
  submitted_link text default '',
  file_name text default '',
  file_url text default '',
  status text not null default 'Soumis',
  score numeric,
  feedback text default '',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table if not exists public.course_notifications (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'info',
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  course_id text not null,
  course_title text not null,
  registration_fee numeric not null default 0,
  participation_fee numeric not null default 0,
  amount_due_now numeric not null default 0,
  payment_method text not null,
  transaction_id text not null,
  receipt_file_name text default '',
  status text not null default 'En attente de vérification',
  created_at timestamptz not null default now()
);

create index if not exists course_sections_course_position_idx
  on public.course_sections(course_id, position);

create index if not exists course_items_section_position_idx
  on public.course_items(section_id, position);

insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', true)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.student_courses enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.course_items enable row level security;
alter table public.course_quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.course_notifications enable row level security;
alter table public.registrations enable row level security;

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

drop policy if exists "Les étudiants peuvent voir leurs cours attribués" on public.student_courses;
create policy "Les étudiants peuvent voir leurs cours attribués"
on public.student_courses for select
using (auth.uid() = student_id or public.is_admin());

drop policy if exists "Les admins peuvent gérer les cours attribués" on public.student_courses;
create policy "Les admins peuvent gérer les cours attribués"
on public.student_courses for all
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

drop policy if exists "Admins can manage quizzes" on public.course_quizzes;
create policy "Admins can manage quizzes"
on public.course_quizzes for all
using (public.is_admin());

drop policy if exists "Admins can manage quiz questions" on public.quiz_questions;
create policy "Admins can manage quiz questions"
on public.quiz_questions for all
using (public.is_admin());

drop policy if exists "Admins can manage quiz options" on public.quiz_options;
create policy "Admins can manage quiz options"
on public.quiz_options for all
using (public.is_admin());

drop policy if exists "Students can see their quiz attempts" on public.quiz_attempts;
create policy "Students can see their quiz attempts"
on public.quiz_attempts for select
using (auth.uid() = student_id or public.is_admin());

drop policy if exists "Students can submit quiz attempts" on public.quiz_attempts;
create policy "Students can submit quiz attempts"
on public.quiz_attempts for insert
with check (auth.uid() = student_id or public.is_admin());

drop policy if exists "Students can see quiz answers" on public.quiz_answers;
create policy "Students can see quiz answers"
on public.quiz_answers for select
using (public.is_admin() or exists (
  select 1 from public.quiz_attempts
  where quiz_attempts.id = quiz_answers.attempt_id
  and quiz_attempts.student_id = auth.uid()
));

drop policy if exists "Students can submit assignments" on public.assignments;
create policy "Students can submit assignments"
on public.assignments for select
using (
  public.is_admin() or exists (
    select 1 from public.student_courses
    where student_courses.student_id = auth.uid()
    and student_courses.course_id = assignments.course_id
  )
);

drop policy if exists "Admins can manage assignments" on public.assignments;
create policy "Admins can manage assignments"
on public.assignments for all
using (public.is_admin());

drop policy if exists "Students can submit assignment submissions" on public.assignment_submissions;
create policy "Students can submit assignment submissions"
on public.assignment_submissions for insert
with check (auth.uid() = student_id or public.is_admin());

drop policy if exists "Students can read their assignment submissions" on public.assignment_submissions;
create policy "Students can read their assignment submissions"
on public.assignment_submissions for select
using (auth.uid() = student_id or public.is_admin());

drop policy if exists "Admins can manage assignment submissions" on public.assignment_submissions;
create policy "Admins can manage assignment submissions"
on public.assignment_submissions for all
using (public.is_admin());

drop policy if exists "Students can read notifications for their courses" on public.course_notifications;
create policy "Students can read notifications for their courses"
on public.course_notifications for select
using (
  public.is_admin() or exists (
    select 1 from public.student_courses
    where student_courses.student_id = auth.uid()
    and student_courses.course_id = course_notifications.course_id
  )
);

drop policy if exists "Admins can manage notifications" on public.course_notifications;
create policy "Admins can manage notifications"
on public.course_notifications for all
using (public.is_admin());

drop policy if exists "Public can submit registrations" on public.registrations;
create policy "Public can submit registrations"
on public.registrations for insert
with check (true);

drop policy if exists "Admins can read registrations" on public.registrations;
create policy "Admins can read registrations"
on public.registrations for select
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
