-- Ejecutar en Supabase SQL Editor. No modifica los registros existentes.
create table if not exists public.user_kv_store (
 user_id uuid not null references auth.users(id) on delete cascade,
 key text not null,
 value text not null,
 updated_at timestamptz not null default now(),
 primary key (user_id,key)
);
alter table public.user_kv_store enable row level security;
revoke all on public.user_kv_store from anon;
grant select,insert,update,delete on public.user_kv_store to authenticated;
drop policy if exists own_records on public.user_kv_store;
create policy own_records on public.user_kv_store for all to authenticated
using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- La tabla anterior solo se consulta por el backend en desarrollo local.
alter table public.kv_store enable row level security;
revoke all on public.kv_store from anon,authenticated;
