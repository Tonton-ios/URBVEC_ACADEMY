-- À exécuter une fois dans Supabase SQL Editor.
-- Accès étudiant aux contenus attribués et dépôt de devoirs.

begin;

drop policy if exists "Public can read published courses" on public.courses;
create policy "Public can read published courses" on public.courses for select
using (status = 'Publié' or public.can_access_course(id));

drop policy if exists "Public can read sections" on public.course_sections;
create policy "Public can read sections" on public.course_sections for select
using (public.is_admin() or public.can_access_course(course_id));

drop policy if exists "Public can read course items" on public.course_items;
create policy "Public can read course items" on public.course_items for select
using (public.is_admin() or public.can_access_course(course_id));

insert into storage.buckets (id, name, public)
values ('assignment-files', 'assignment-files', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated students can upload assignment files" on storage.objects;
create policy "Authenticated students can upload assignment files"
on storage.objects for insert
with check (bucket_id = 'assignment-files' and auth.role() = 'authenticated');

drop policy if exists "Public can read assignment files" on storage.objects;
create policy "Public can read assignment files"
on storage.objects for select
using (bucket_id = 'assignment-files');

commit;
