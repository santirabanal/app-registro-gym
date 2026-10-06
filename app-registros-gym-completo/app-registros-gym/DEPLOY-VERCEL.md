# Desplegar Mi Gym con varios usuarios

## 1. Preparar Supabase

1. Ejecutar `modulo-entrenamiento/backend/schema-users.sql` en SQL Editor.
2. En Authentication > Sign In / Providers, habilitar Google con un cliente OAuth de Google Cloud (tipo Web application). Su URI de redirección autorizada es `https://btqqoafoojrmecefzhmn.supabase.co/auth/v1/callback`. Configurar Site URL con la URL final de Vercel y agregar `http://localhost:5173` y la URL final a Redirect URLs. Si Google está en modo Testing, agregar las dos cuentas de prueba a Test users. Usar únicamente permisos básicos de identidad; no requiere activar facturación de Google Cloud.
3. Obtener Project URL y la clave **publishable** en el panel de API/Connect. Esta clave es pública; no usar una clave secret ni service_role en variables `VITE_*`.

## 2. Configurar Vercel

Importar el repositorio GitHub `santirabanal/app-registro-gym`. Con la estructura actual del repositorio local, Root Directory es:

`app-registros-gym-completo/app-registros-gym`

Confirmar que esa carpeta y los cambios están subidos al repositorio antes de importar. Framework: Vite. Build: `npm run build`. Output: `dist`. Node: 24.x. El archivo `vercel.json` define las funciones y rutas.

Configurar en Environment Variables:

| Variable | Valor |
| --- | --- |
| DATABASE_URL | URI de conexión PostgreSQL de Supabase |
| SUPABASE_URL | URL del proyecto Supabase |
| SUPABASE_PUBLISHABLE_KEY | Clave pública publishable |
| VITE_SUPABASE_URL | La misma URL de Supabase |
| VITE_SUPABASE_PUBLISHABLE_KEY | La misma clave pública |

No configurar `API_KEY`, `VITE_API_KEY` ni una URL `VITE_API_BASE_URL` de localhost. Las APIs usan `/api` en el mismo dominio. DATABASE_URL solo existe en el servidor.

## 3. Conservar tus registros

Ingresar con Google desde la aplicación para crear tu cuenta. Copiar su UUID desde Authentication > Users. Reemplazar el UUID de ejemplo en `modulo-entrenamiento/backend/migrate-owner.sql` y ejecutar el script. Copia los datos anteriores a TU cuenta, sin borrar los originales ni sobrescribir datos ya existentes de la cuenta.

Las cuentas nuevas empiezan sin el histórico personal que usaba la versión local.

## 4. Verificación antes de usarla

Probar login, logout y recarga. Crear dos cuentas y verificar que peso, ejercicios y tema se mantienen separados. Probar que `/api/kv/ejercicios` sin sesión devuelve 401. Verificar el scraper desde Vercel: cada tienda puede responder distinto desde sus servidores.

## Desarrollo local

El frontend necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en su `.env`. El backend necesita `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y DATABASE_URL en su `.env`. Reiniciar ambos después de configurarlos.

Sin variables Auth, solo el desarrollo local conserva el modo anterior. En producción, la aplicación y API rechazan acceder a registros si falta configurar autenticación.

La caché del scraper es una optimización por instancia, no una garantía compartida. Los resultados se pueden recalcular en cada instancia sin perder registros.

## Mantener costo cero

Usar Supabase Free y Vercel Hobby para uso personal no comercial. No activar upgrades, facturación de Google Cloud, SMS ni dominios pagos. El acceso con Google evita depender de emails de Supabase o de un proveedor SMTP. Al alcanzar límites gratuitos, reducir uso o aceptar la pausa del servicio; no contratar capacidad adicional. Revisar el plan en ambos paneles antes de desplegar.
