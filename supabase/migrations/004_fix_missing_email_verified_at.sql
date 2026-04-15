-- Parche rápido si solo te falta la columna (mismo efecto que el inicio de 002).
-- Ejecuta en Supabase → SQL Editor. Luego espera ~1 min o recarga el proyecto si el error de caché persiste.

alter table public.delivery_users
  add column if not exists email_verified_at bigint;

update public.delivery_users
set email_verified_at = coalesce(email_verified_at, created_at, floor(extract(epoch from now()))::bigint)
where email_verified_at is null;
