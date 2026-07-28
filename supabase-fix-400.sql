-- Execute this file once in Supabase SQL Editor for an existing project.

alter table public.courses
  add column if not exists participation_fee numeric not null default 0;

alter table if exists public.course_items
  add column if not exists deadline_at timestamptz;

create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
end;
$$ language plpgsql security definer;

alter table public.profiles enable row level security;

drop policy if exists "Les utilisateurs peuvent voir leur propre profil" on public.profiles;
create policy "Les utilisateurs peuvent voir leur propre profil"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Les admins peuvent voir tous les profils" on public.profiles;
create policy "Les admins peuvent voir tous les profils"
on public.profiles for select
using (public.is_admin());

alter table public.course_quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;

drop policy if exists "Students can read course quizzes" on public.course_quizzes;
create policy "Students can read course quizzes"
on public.course_quizzes for select
using (public.is_admin() or public.can_access_course(course_id));

drop policy if exists "Students can read quiz questions" on public.quiz_questions;
create policy "Students can read quiz questions"
on public.quiz_questions for select
using (public.is_admin() or exists (
  select 1 from public.course_quizzes q
  where q.id = quiz_questions.quiz_id and public.can_access_course(q.course_id)
));

drop policy if exists "Students can read quiz options" on public.quiz_options;
create policy "Students can read quiz options"
on public.quiz_options for select
using (public.is_admin() or exists (
  select 1 from public.quiz_questions qq
  join public.course_quizzes q on q.id = qq.quiz_id
  where qq.id = quiz_options.question_id and public.can_access_course(q.course_id)
));

-- Creates missing profile rows for accounts that already exist in Supabase Auth.
insert into public.profiles (id, email, full_name, phone, is_admin)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', ''),
  coalesce(raw_user_meta_data ->> 'phone', ''),
  coalesce((raw_user_meta_data ->> 'is_admin')::boolean, false)
from auth.users
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
  phone = coalesce(nullif(public.profiles.phone, ''), excluded.phone);

-- Replace the email below with the email address of your administrator account.
-- update public.profiles set is_admin = true where email = 'admin@your-domain.com';

insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('assignment-files', 'assignment-files', true)
on conflict (id) do nothing;

drop policy if exists "Public can read course files" on storage.objects;
create policy "Public can read course files"
on storage.objects for select
using (bucket_id = 'course-files');

drop policy if exists "Admins can manage course files" on storage.objects;
create policy "Admins can manage course files"
on storage.objects for all
using (bucket_id = 'course-files' and public.is_admin())
with check (bucket_id = 'course-files' and public.is_admin());

drop policy if exists "Students can upload assignment files" on storage.objects;
create policy "Students can upload assignment files"
on storage.objects for insert
with check (bucket_id = 'assignment-files' and auth.role() = 'authenticated');

drop policy if exists "Users can read assignment files" on storage.objects;
create policy "Users can read assignment files"
on storage.objects for select
using (bucket_id = 'assignment-files' and auth.role() = 'authenticated');
