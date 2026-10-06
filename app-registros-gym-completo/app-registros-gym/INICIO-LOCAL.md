# Mi Gym: iniciar ambos módulos

Abrir tres terminales desde esta carpeta:

1. En `modulo-entrenamiento/backend`: ejecutar `npm start` (puerto 3002; requiere `.env` configurado).
2. En `comparador-precios`: ejecutar `npm start` con `PORT=3012` en el entorno. En PowerShell: `$env:PORT='3012'` y luego `npm start`.
3. En `modulo-entrenamiento/frontend`: ejecutar `npm run dev` (puerto 5173).

Entrar a http://localhost:5173 para acceder a Inicio, Entrenamiento y Suplementos. La navegación conserva el estado de cada módulo mientras se cambia de sección. Los registros se guardan en Supabase y los favoritos en el navegador.

Para probar la versión compilada, ejecutar `npm run build` en el frontend y abrir http://localhost:3012. El comparador sirve el dashboard compilado y su interfaz bajo `/suplementos/`. El backend de entrenamiento debe seguir ejecutándose en 3002.

## Verificación del comparador

En `comparador-precios`, ejecutar `node --test verify.test.mjs`.

El precio general se usa para comparar; los precios sujetos a un medio de pago se muestran como ofertas con sus condiciones. Los productos sin peso conocido quedan al final al ordenar por precio/kg. Las mezclas y combos identificados se excluyen de la recomendación de creatina pura.

Pendiente externo: Nutrishop no resuelve por DNS desde este entorno. Se conserva la tienda configurada y se informa el fallo; no se inventan precios ni se usan datos de búsqueda desactualizados. SelmaDigital, Entreno, Morashop y Farmacity devolvieron productos en las pruebas reales.

Esta integración es local. La publicación requiere configurar las URLs de los servicios y autenticación de usuarios.
