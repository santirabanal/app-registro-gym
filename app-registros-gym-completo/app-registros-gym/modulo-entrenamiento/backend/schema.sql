-- Ejecutar esto una vez en tu base de datos (Supabase, Neon, o cualquier
-- Postgres) para crear la tabla que va a guardar los datos de la app.
-- En Supabase: Project > SQL Editor > pegar esto > Run.

create table if not exists kv_store (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
