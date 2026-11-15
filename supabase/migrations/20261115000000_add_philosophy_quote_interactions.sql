create schema if not exists private;
create table if not exists arise_site.quote_comments (
 id uuid primary key default gen_random_uuid(),
 quote_key text not null check (quote_key in ('challenge-your-challenge','poverty-will-suffer')),
 display_name text not null default 'Guest' check (char_length(display_name) between 1 and 60),
 comment_text text not null check (char_length(btrim(comment_text)) between 2 and 1200),
 moderation_status text not null default 'approved' check (moderation_status in ('approved','held')),
 moderation_reason text, edit_token_hash text not null,
 edit_expires_at timestamptz not null default (now() + interval '365 days'),
 ip_hash text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists quote_comments_public_idx on arise_site.quote_comments (quote_key, moderation_status, created_at desc);
create index if not exists quote_comments_ip_idx on arise_site.quote_comments (ip_hash, created_at desc);
create table if not exists arise_site.quote_reactions (
 id uuid primary key default gen_random_uuid(),
 quote_key text not null check (quote_key in ('challenge-your-challenge','poverty-will-suffer')),
 reaction text not null check (reaction in ('love','like')), visitor_hash text not null,
 created_at timestamptz not null default now(), unique (quote_key, reaction, visitor_hash)
);
create index if not exists quote_reactions_count_idx on arise_site.quote_reactions (quote_key, reaction);
create table if not exists arise_site.quote_comment_rate_limits (
 id bigint generated always as identity primary key, ip_hash text not null, action text not null, created_at timestamptz not null default now()
);
create index if not exists quote_comment_rate_limits_recent_idx on arise_site.quote_comment_rate_limits (ip_hash, action, created_at desc);
alter table arise_site.quote_comments enable row level security;
alter table arise_site.quote_reactions enable row level security;
alter table arise_site.quote_comment_rate_limits enable row level security;
revoke all on arise_site.quote_comments from anon, authenticated;
revoke all on arise_site.quote_reactions from anon, authenticated;
revoke all on arise_site.quote_comment_rate_limits from anon, authenticated;
grant all on arise_site.quote_comments to service_role;
grant all on arise_site.quote_reactions to service_role;
grant all on arise_site.quote_comment_rate_limits to service_role;