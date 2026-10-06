-- Después de crear TU cuenta, copiar su UUID desde Authentication > Users.
-- Reemplazar el UUID de ejemplo antes de ejecutar. Conserva los datos anteriores.
begin;
insert into public.user_kv_store (user_id,key,value,updated_at)
select '00000000-0000-0000-0000-000000000000'::uuid,key,value,updated_at
from public.kv_store
on conflict (user_id,key) do nothing;
commit;
