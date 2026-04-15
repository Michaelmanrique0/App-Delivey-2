-- El correo sigue siendo único; el nombre de usuario puede repetirse entre cuentas.
-- Ejecutar en Supabase SQL Editor después de 001 y 002.
-- Si ves: duplicate key value violates unique constraint "delivery_users_username_key" → falta aplicar este script.

-- Nombre por defecto al crear la tabla con "username ... UNIQUE":
alter table public.delivery_users drop constraint if exists delivery_users_username_key;

-- Si el constraint tuvo otro nombre, elimina cualquier UNIQUE definido solo sobre la columna username:
do $$
declare
  r record;
begin
  for r in
    select c.conname as cname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'delivery_users'
      and c.contype = 'u'
      and coalesce(array_length(c.conkey, 1), 0) = 1
      and exists (
        select 1
        from pg_attribute a
        where a.attrelid = c.conrelid
          and a.attnum = c.conkey[1]
          and a.attname = 'username'
      )
  loop
    execute format('alter table public.delivery_users drop constraint if exists %I', r.cname);
  end loop;
end $$;

-- Por si existiera un índice único suelto con el mismo nombre (poco habitual):
drop index if exists public.delivery_users_username_key;
