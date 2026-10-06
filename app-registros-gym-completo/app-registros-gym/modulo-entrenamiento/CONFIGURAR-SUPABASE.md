# Conectar el registro a Supabase

1. Crear un proyecto en https://supabase.com/dashboard. Guardar la contraseña de la base.
2. En SQL Editor ejecutar el contenido de `backend/schema.sql`.
3. En Connect elegir URI y Session pooler. Copiar la conexión y reemplazar el marcador de contraseña por la contraseña real (codificar los caracteres especiales para una URL).
4. Pegar la conexión únicamente en `backend/.env`, después de `DATABASE_URL=`. Este archivo está ignorado por Git. No compartirlo en el chat.
5. Reiniciar el backend desde su carpeta con `npm start`.
6. Abrir http://localhost:3002/health: debe devolver `{"ok":true,"database":true}`.
7. Abrir http://localhost:5173, guardar un peso y un ejercicio, y recargar para verificar que persisten.

Documentación: https://supabase.com/docs/guides/database/connecting-to-postgres

Esta configuración es para probar localmente. Antes de publicar, hay que implementar autenticación de usuarios; una clave incluida en el frontend no protege un servicio público.
