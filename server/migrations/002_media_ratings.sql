create extension if not exists pgcrypto;

create table if not exists public.media_ratings (
  id uuid primary key default gen_random_uuid(),
  media_id text not null references public.media_items(id) on delete cascade,
  rater_key text not null,
  rater_name text not null,
  discord_user_id text,
  source text not null check (source in ('discord', 'web')),
  score smallint not null check (score between 1 and 10),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_ratings_rater_key_length check (char_length(rater_key) between 1 and 120),
  constraint media_ratings_rater_name_length check (char_length(rater_name) between 1 and 80),
  constraint media_ratings_comment_length check (comment is null or char_length(comment) <= 500),
  constraint media_ratings_media_rater_unique unique (media_id, rater_key)
);

create index if not exists media_ratings_media_id_idx
  on public.media_ratings (media_id);

create index if not exists media_ratings_media_score_idx
  on public.media_ratings (media_id, score desc);

alter table public.media_ratings enable row level security;

drop policy if exists media_ratings_read on public.media_ratings;
create policy media_ratings_read
  on public.media_ratings for select
  using (true);

drop policy if exists media_ratings_insert on public.media_ratings;
create policy media_ratings_insert
  on public.media_ratings for insert
  with check (true);

drop policy if exists media_ratings_update on public.media_ratings;
create policy media_ratings_update
  on public.media_ratings for update
  using (true)
  with check (true);

grant select, insert, update on public.media_ratings to anon, authenticated;

create or replace view public.media_watch_stats
with (security_invoker = true)
as
select
  m.id,
  m.title,
  m.category,
  m.image,
  m.synopsis,
  m.genre,
  m.all_genres,
  m.capsule_color,
  m.suggested_by,
  m.status,
  m.created_at,
  m.consumed_at,
  coalesce(round(avg(r.score)::numeric, 1), 0)::numeric(4, 1) as average_score,
  count(r.id)::integer as rating_count
from public.media_items m
left join public.media_ratings r on r.media_id = m.id
where m.status = 'WATCHED'
group by m.id;

grant select on public.media_watch_stats to anon, authenticated;

notify pgrst, 'reload schema';
