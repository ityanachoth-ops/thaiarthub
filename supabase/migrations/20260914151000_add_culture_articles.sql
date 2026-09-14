-- ThaiArtHub Culture / Articles Phase 1.
-- Reuses public.content_status and public.is_admin() from the V1 schema.

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,159}$'),
  excerpt text,
  content text not null check (char_length(trim(content)) > 0),
  cover_image_url text,
  category text not null check (category in ('artist', 'local-brand', 'music', 'event-report', 'local-story', 'guide')),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_publication_integrity check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  )
);

create index articles_status_published_at_idx on public.articles (status, published_at desc);
create index articles_author_id_idx on public.articles (author_id);

create trigger articles_set_updated_at before update on public.articles
for each row execute function public.set_updated_at();

alter table public.articles enable row level security;

create policy "Published articles are public"
on public.articles
for select
to anon, authenticated
using (status = 'published' or public.is_admin());

create policy "Admins create articles"
on public.articles
for insert
to authenticated
with check (public.is_admin() and author_id = auth.uid());

create policy "Admins update articles"
on public.articles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins delete articles"
on public.articles
for delete
to authenticated
using (public.is_admin());

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

insert into storage.buckets (id, name, public)
values ('articles', 'articles', false)
on conflict (id) do nothing;

create policy "Anon read published article covers by exact path"
on storage.objects
for select
to anon
using (
  bucket_id = 'articles'
  and storage.allow_only_operation('storage.object.get_signed')
  and exists (
    select 1
    from public.articles
    where articles.cover_image_url = storage.objects.name
      and articles.status = 'published'
  )
);

create policy "Admins read article media"
on storage.objects
for select
to authenticated
using (bucket_id = 'articles' and public.is_admin());

create policy "Admins upload article media under own prefix"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'articles'
  and public.is_admin()
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Admins update article media"
on storage.objects
for update
to authenticated
using (bucket_id = 'articles' and public.is_admin())
with check (bucket_id = 'articles' and public.is_admin());

create policy "Admins delete article media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'articles' and public.is_admin());