-- Ejecuta esto en Supabase → SQL Editor (o usa la CLI de Supabase con esta migración).
-- Tablas con prefijo delivery_ para no chocar con tablas del sistema.

create extension if not exists citext;

create table if not exists public.delivery_users (
  id serial primary key,
  username citext not null,
  email citext unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'mensajero')),
  created_at bigint not null default (floor(extract(epoch from now())))::bigint
);

create table if not exists public.delivery_orders (
  id bigint primary key,
  payload jsonb not null,
  updated_at bigint not null default (floor(extract(epoch from now())))::bigint
);

create table if not exists public.delivery_app_meta (
  key text primary key,
  value text not null
);

create table if not exists public.delivery_password_resets (
  token text primary key,
  user_id integer not null references public.delivery_users (id) on delete cascade,
  expires_ms bigint not null
);

create index if not exists delivery_password_resets_user_id_idx
  on public.delivery_password_resets (user_id);
