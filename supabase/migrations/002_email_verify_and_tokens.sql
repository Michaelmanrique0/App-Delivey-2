-- Verificación de correo y tokens (confirmación + recuperación de contraseña).
-- OBLIGATORIO en Supabase → SQL Editor (después de 001), o el servidor fallará al crear usuarios:
-- "Could not find the 'email_verified_at' column ... in the schema cache"

alter table public.delivery_users
  add column if not exists email_verified_at bigint;

-- Cuentas ya existentes: se consideran verificadas (no bloquear acceso).
update public.delivery_users
set email_verified_at = coalesce(email_verified_at, created_at, floor(extract(epoch from now()))::bigint)
where email_verified_at is null;

create table if not exists public.delivery_email_tokens (
  token text primary key,
  user_id integer not null references public.delivery_users (id) on delete cascade,
  kind text not null check (kind in ('verify_email', 'password_reset')),
  expires_ms bigint not null
);

create index if not exists delivery_email_tokens_user_kind_idx
  on public.delivery_email_tokens (user_id, kind);

-- Sustituida por delivery_email_tokens (kind = password_reset).
drop table if exists public.delivery_password_resets;
