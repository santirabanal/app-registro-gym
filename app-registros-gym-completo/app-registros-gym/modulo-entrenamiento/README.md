# Módulo de entrenamiento — backend + frontend

Versión standalone (fuera de Claude) del registro de entrenamiento. Antes
era un artefacto que usaba `window.storage`; ahora es un proyecto React
normal que habla con un backend propio conectado a una base de datos real,
así tus datos se ven igual desde cualquier dispositivo.

## Piezas

- `backend/`: API en Express que guarda/lee datos de una base Postgres.
- `frontend/`: la app en sí (React + Vite), igual a la que usabas en Claude.

## 1. Base de datos (una sola vez)

1. Creá un proyecto gratis en [Supabase](https://supabase.com) (o [Neon](https://neon.tech), cualquiera de las dos sirve).
2. Andá a SQL Editor y corré el contenido de `backend/schema.sql`.
3. Copiá el connection string de Postgres (en Supabase: Project Settings > Database > Connection string > modo "URI").

## 2. Backend — correr local

```
cd backend
npm install
cp .env.example .env
```

Editá `.env` y pegá tu `DATABASE_URL`. Dejá `API_KEY` vacío para probar local.

```
npm run dev
```

Tiene que decir "API del módulo de entrenamiento corriendo en puerto 3002".

## 3. Frontend — correr local

```
cd frontend
npm install
cp .env.example .env
npm run dev
```

Te va a dar una URL tipo `http://localhost:5173` — abrila en el navegador.

## 4. Deploy

- **Backend → Render** (o Railway): conectá el repo de GitHub, elegí la carpeta `backend`, seteá las variables de entorno `DATABASE_URL` y `API_KEY` (esta vez sí definí una — es lo que protege tus datos en producción) en el panel del hosting.
- **Frontend → Vercel**: conectá el mismo repo, elegí la carpeta `frontend` como root del proyecto, y seteá `VITE_API_BASE_URL` (la URL que te da Render) y `VITE_API_KEY` (la misma que pusiste en el backend) en las variables de entorno de Vercel.

Una vez deployados los dos, entrás a la URL de Vercel y listo — la app funciona igual que en Claude, pero ahora vive en internet con tu propia base de datos.

## Nota de seguridad

Sin `API_KEY` configurada, cualquiera que tenga la URL del backend podría
leer o escribir tus datos. Es aceptable para probar local, pero definí una
antes de deployar a producción.
