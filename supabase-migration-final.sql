begin;

create extension if not exists "pgcrypto";

-- =========================
-- CLEANUP OF LEGACY SHAPE
-- =========================
alter table if exists public.profiles
  drop column if exists assigned_course_id,
  drop column if exists assigned_course_title;

drop trigger if exists on_auth_user_created on auth.users;

-- =========================
-- PROFILES
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  phone text default '',
  is_admin boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- HELPERS
-- =========================
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
end;
$$;

create or replace function public.can_access_course(p_course_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return public.is_admin() or exists (
    select 1
    from public.student_courses sc
    where sc.student_id = auth.uid()
      and sc.course_id = p_course_id
      and sc.status = 'Actif'
  );
end;
$$;

create or replace function public.can_access_assignment(p_assignment_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return public.is_admin() or exists (
    select 1
    from public.assignments a
    join public.student_courses sc on sc.course_id = a.course_id
    where a.id = p_assignment_id
      and sc.student_id = auth.uid()
      and sc.status = 'Actif'
  );
end;
$$;

create or replace function public.can_access_quiz(p_quiz_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return public.is_admin() or exists (
    select 1
    from public.course_quizzes q
    join public.student_courses sc on sc.course_id = q.course_id
    where q.id = p_quiz_id
      and sc.student_id = auth.uid()
      and sc.status = 'Actif'
  );
end;
$$;

-- =========================
-- CORE TABLES
-- =========================
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

alter table public.courses
  add column if not exists participation_fee numeric not null default 0;

alter table public.course_items
  add column if not exists deadline_at timestamptz;

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

create table if not exists public.student_activity_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  action text default '',
  time text default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.student_library_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  item_id uuid,
  title text not null,
  kind text default '',
  url text default '',
  file_name text default '',
  note text default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- INDEXES
-- =========================
create index if not exists course_sections_course_position_idx
  on public.course_sections(course_id, position);

create index if not exists course_items_section_position_idx
  on public.course_items(section_id, position);

-- =========================
-- STORAGE
-- =========================
insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', true)
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

-- =========================
-- RLS
-- =========================
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
alter table public.student_activity_logs enable row level security;
alter table public.student_library_items enable row level security;

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
      and courses.status = 'Publié'
  )
);

drop policy if exists "Public can read course items" on public.course_items;
create policy "Public can read course items"
on public.course_items for select
using (
  exists (
    select 1 from public.courses
    where courses.id = course_items.course_id
      and courses.status = 'Publié'
  )
);

drop policy if exists "Les utilisateurs peuvent voir leur propre profil" on public.profiles;
create policy "Les utilisateurs peuvent voir leur propre profil"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Les admins peuvent voir tous les profils" on public.profiles;
create policy "Les admins peuvent voir tous les profils"
on public.profiles for select
using (public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Les étudiants peuvent voir leurs cours attribués" on public.student_courses;
create policy "Les étudiants peuvent voir leurs cours attribués"
on public.student_courses for select
using (auth.uid() = student_id or public.is_admin());

drop policy if exists "Les admins peuvent gérer les cours attribués" on public.student_courses;
create policy "Les admins peuvent gérer les cours attribués"
on public.student_courses for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Prototype admin can manage courses" on public.courses;
create policy "Prototype admin can manage courses"
on public.courses for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Prototype admin can manage sections" on public.course_sections;
create policy "Prototype admin can manage sections"
on public.course_sections for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Prototype admin can manage items" on public.course_items;
create policy "Prototype admin can manage items"
on public.course_items for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage quizzes" on public.course_quizzes;
create policy "Admins can manage quizzes"
on public.course_quizzes for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage quiz questions" on public.quiz_questions;
create policy "Admins can manage quiz questions"
on public.quiz_questions for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage quiz options" on public.quiz_options;
create policy "Admins can manage quiz options"
on public.quiz_options for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Students can see their quiz attempts" on public.quiz_attempts;
create policy "Students can see their quiz attempts"
on public.quiz_attempts for select
using (auth.uid() = student_id or public.is_admin());

drop policy if exists "Students can submit quiz attempts" on public.quiz_attempts;
create policy "Students can submit quiz attempts"
on public.quiz_attempts for insert
with check (
  (auth.uid() = student_id or public.is_admin())
  and public.can_access_quiz(quiz_id)
  and exists (
    select 1 from public.course_quizzes
    where course_quizzes.id = quiz_id
      and (course_quizzes.opens_at is null or course_quizzes.opens_at <= now())
      and (course_quizzes.closes_at is null or course_quizzes.closes_at >= now())
  )
);

drop policy if exists "Students can see quiz answers" on public.quiz_answers;
create policy "Students can see quiz answers"
on public.quiz_answers for select
using (
  public.is_admin() or exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_answers.attempt_id
      and quiz_attempts.student_id = auth.uid()
  )
);

drop policy if exists "Students can submit quiz answers" on public.quiz_answers;
create policy "Students can submit quiz answers"
on public.quiz_answers for insert
with check (
  public.is_admin() or exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_answers.attempt_id
      and quiz_attempts.student_id = auth.uid()
  )
);

drop policy if exists "Students can read assignments" on public.assignments;
create policy "Students can read assignments"
on public.assignments for select
using (
  public.is_admin() or public.can_access_course(assignments.course_id)
);

drop policy if exists "Admins can manage assignments" on public.assignments;
create policy "Admins can manage assignments"
on public.assignments for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Students can submit assignment submissions" on public.assignment_submissions;
create policy "Students can submit assignment submissions"
on public.assignment_submissions for insert
with check (
  (auth.uid() = student_id or public.is_admin())
  and public.can_access_assignment(assignment_id)
  and exists (
    select 1 from public.assignments
    where assignments.id = assignment_id
      and (assignments.deadline_at is null or assignments.deadline_at >= now())
  )
);

drop policy if exists "Students can read their assignment submissions" on public.assignment_submissions;
create policy "Students can read their assignment submissions"
on public.assignment_submissions for select
using (auth.uid() = student_id or public.is_admin());

drop policy if exists "Admins can manage assignment submissions" on public.assignment_submissions;
create policy "Admins can manage assignment submissions"
on public.assignment_submissions for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Students can read notifications for their courses" on public.course_notifications;
create policy "Students can read notifications for their courses"
on public.course_notifications for select
using (
  public.is_admin() or public.can_access_course(course_notifications.course_id)
);

drop policy if exists "Admins can manage notifications" on public.course_notifications;
create policy "Admins can manage notifications"
on public.course_notifications for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can submit registrations" on public.registrations;
create policy "Public can submit registrations"
on public.registrations for insert
with check (true);

drop policy if exists "Admins can read registrations" on public.registrations;
create policy "Admins can read registrations"
on public.registrations for select
using (public.is_admin());

drop policy if exists "Students can read their activity logs" on public.student_activity_logs;
create policy "Students can read their activity logs"
on public.student_activity_logs for select
using (auth.uid() = student_id or public.is_admin());

drop policy if exists "Students can insert their activity logs" on public.student_activity_logs;
create policy "Students can insert their activity logs"
on public.student_activity_logs for insert
with check (auth.uid() = student_id or public.is_admin());

drop policy if exists "Students can read their library items" on public.student_library_items;
create policy "Students can read their library items"
on public.student_library_items for select
using (auth.uid() = student_id or public.is_admin());

drop policy if exists "Students can manage their library items" on public.student_library_items;
create policy "Students can manage their library items"
on public.student_library_items for all
using (auth.uid() = student_id or public.is_admin())
with check (auth.uid() = student_id or public.is_admin());

drop policy if exists "Public can read course files" on storage.objects;
create policy "Public can read course files"
on storage.objects for select
using (bucket_id = 'course-files');

drop policy if exists "Prototype admin can upload course files" on storage.objects;
create policy "Prototype admin can upload course files"
on storage.objects for insert
with check (
  bucket_id = 'course-files'
  and public.is_admin()
);

-- =========================
-- RPCs
-- =========================
create or replace function public.admin_assign_courses(
  p_student_id uuid,
  p_course_ids uuid[]
)
returns void
language plpgsql
security definer
as $$
declare
  p_course_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  delete from public.student_courses
  where student_id = p_student_id;

  foreach p_course_id in array coalesce(p_course_ids, '{}') loop
    insert into public.student_courses (student_id, course_id, granted_by, status)
    values (p_student_id, p_course_id, auth.uid(), 'Actif')
    on conflict (student_id, course_id)
    do update set
      granted_by = excluded.granted_by,
      status = excluded.status,
      updated_at = now();
  end loop;

  update public.profiles
  set assigned_course_id = (
        select course_id
        from public.student_courses
        where student_id = p_student_id
        order by created_at asc
        limit 1
      ),
      assigned_course_title = (
        select c.title
        from public.student_courses sc
        join public.courses c on c.id = sc.course_id
        where sc.student_id = p_student_id
        order by sc.created_at asc
        limit 1
      ),
      updated_at = now()
  where id = p_student_id;
end;
$$;

create or replace function public.admin_remove_student(
  p_student_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  delete from public.student_courses where student_id = p_student_id;
  delete from public.quiz_answers where attempt_id in (
    select id from public.quiz_attempts where student_id = p_student_id
  );
  delete from public.quiz_attempts where student_id = p_student_id;
  delete from public.assignment_submissions where student_id = p_student_id;
  delete from public.profiles where id = p_student_id;
end;
$$;

create or replace function public.admin_upsert_student_profile(
  p_email text,
  p_full_name text,
  p_phone text,
  p_course_ids uuid[]
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_profile_id uuid;
  v_course_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  select id into v_profile_id
  from public.profiles
  where lower(email) = lower(p_email)
  limit 1;

  if v_profile_id is null then
    v_profile_id := gen_random_uuid();
    insert into public.profiles (id, email, full_name, phone, is_admin)
    values (v_profile_id, p_email, p_full_name, coalesce(p_phone, ''), false);
  else
    update public.profiles
    set full_name = p_full_name,
        phone = coalesce(p_phone, phone),
        updated_at = now()
    where id = v_profile_id;
  end if;

  delete from public.student_courses where student_id = v_profile_id;

  foreach v_course_id in array coalesce(p_course_ids, '{}') loop
    insert into public.student_courses (student_id, course_id, granted_by, status)
    values (v_profile_id, v_course_id, auth.uid(), 'Actif')
    on conflict (student_id, course_id)
    do update set
      granted_by = excluded.granted_by,
      status = excluded.status,
      updated_at = now();
  end loop;

  update public.profiles
  set assigned_course_id = (
        select course_id
        from public.student_courses
        where student_id = v_profile_id
        order by created_at asc
        limit 1
      ),
      assigned_course_title = (
        select c.title
        from public.student_courses sc
        join public.courses c on c.id = sc.course_id
        where sc.student_id = v_profile_id
        order by sc.created_at asc
        limit 1
      ),
      updated_at = now()
  where id = v_profile_id;

  return v_profile_id;
end;
$$;

create or replace function public.sync_student_local_data(
  p_label text,
  p_action text default '',
  p_time text default '',
  p_library jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  if auth.uid() is null then
    raise exception 'Not allowed';
  end if;

  insert into public.student_activity_logs (student_id, label, action, time, metadata)
  values (auth.uid(), p_label, coalesce(p_action, ''), coalesce(p_time, ''), jsonb_build_object('source', 'client'))
  on conflict do nothing;

  delete from public.student_library_items where student_id = auth.uid();
  if p_library is not null and jsonb_typeof(p_library) = 'array' then
    insert into public.student_library_items (student_id, title, kind, url, file_name, note, metadata)
    select
      auth.uid(),
      coalesce(item->>'title', ''),
      coalesce(item->>'kind', ''),
      coalesce(item->>'url', ''),
      coalesce(item->>'fileName', item->>'file_name', ''),
      coalesce(item->>'note', ''),
      item
    from jsonb_array_elements(p_library) as item
    where coalesce(item->>'title', '') <> '';
  end if;
end;
$$;

create or replace function public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_answers jsonb
)
returns table(attempt_id uuid, score numeric, total_points numeric)
language plpgsql
security definer
as $$
declare
  v_attempt_id uuid;
  v_total_points numeric := 0;
  v_score numeric := 0;
begin
  if not public.can_access_quiz(p_quiz_id) then
    raise exception 'Not allowed';
  end if;

  if exists (
    select 1
    from public.course_quizzes
    where id = p_quiz_id
      and closes_at is not null
      and closes_at < now()
  ) then
    raise exception 'Deadline passed';
  end if;

  insert into public.quiz_attempts (quiz_id, student_id, score, total_points, submitted_at)
  values (p_quiz_id, auth.uid(), 0, 0, now())
  returning id into v_attempt_id;

  with q as (
    select qq.id, qq.points
    from public.quiz_questions qq
    where qq.quiz_id = p_quiz_id
  )
  select coalesce(sum(points), 0)
  into v_total_points
  from q;

  with attempt_questions as (
    select qq.id as question_id, qq.points, coalesce((p_answers ->> qq.id::text), '') as selected_option_id
    from public.quiz_questions qq
    where qq.quiz_id = p_quiz_id
  ),
  scored as (
    select
      aq.question_id,
      aq.points,
      aq.selected_option_id,
      exists (
        select 1
        from public.quiz_options qo
        where qo.id::uuid = nullif(aq.selected_option_id, '')::uuid
          and qo.question_id = aq.question_id
          and qo.is_correct = true
      ) as is_correct
    from attempt_questions aq
  )
  select coalesce(sum(case when is_correct then points else 0 end), 0)
  into v_score
  from scored;

  update public.quiz_attempts
  set total_points = v_total_points,
      score = v_score,
      graded_at = now()
  where id = v_attempt_id;

  insert into public.quiz_answers (attempt_id, question_id, selected_option_id, is_correct)
  select
    v_attempt_id,
    qq.id,
    nullif(p_answers ->> qq.id::text, '')::uuid,
    exists (
      select 1
      from public.quiz_options qo
      where qo.id = nullif(p_answers ->> qq.id::text, '')::uuid
        and qo.question_id = qq.id
        and qo.is_correct = true
    )
  from public.quiz_questions qq
  where qq.quiz_id = p_quiz_id;

  return query select v_attempt_id, v_score, v_total_points;
end;
$$;

create or replace function public.submit_assignment(
  p_assignment_id uuid,
  p_submitted_text text,
  p_submitted_link text,
  p_file_name text,
  p_file_url text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  if not public.can_access_assignment(p_assignment_id) then
    raise exception 'Not allowed';
  end if;

  if exists (
    select 1
    from public.assignments
    where id = p_assignment_id
      and deadline_at is not null
      and deadline_at < now()
  ) then
    raise exception 'Deadline passed';
  end if;

  insert into public.assignment_submissions (
    assignment_id, student_id, submitted_text, submitted_link, file_name, file_url, status
  )
  values (
    p_assignment_id, auth.uid(), coalesce(p_submitted_text, ''), coalesce(p_submitted_link, ''),
    coalesce(p_file_name, ''), coalesce(p_file_url, ''), 'Soumis'
  )
  on conflict (assignment_id, student_id)
  do update set
    submitted_text = excluded.submitted_text,
    submitted_link = excluded.submitted_link,
    file_name = excluded.file_name,
    file_url = excluded.file_url,
    status = 'Soumis',
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

-- =========================
-- TRIGGER
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, phone, is_admin)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'phone', ''),
    false
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

commit;
