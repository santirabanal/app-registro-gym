# App registros gym

Dashboard personal con módulos independientes relacionados al entrenamiento.

## Módulos

### `modulo-entrenamiento/`
Registro diario de peso corporal y ejercicios clave, con gráficos mensuales
de progreso (promedio móvil de 4 semanas, top set / volumen / 1RM estimado
por ejercicio). Proyecto React + Vite con backend propio en Express +
Postgres (reemplaza el `window.storage` que usaba cuando era un artefacto
de Claude).

- `backend/`: API REST mínima tipo clave-valor (GET/PUT/DELETE `/kv/:key`)
  conectada a Postgres. Ver `backend/schema.sql` para crear la tabla.
- `frontend/`: la app en sí. Habla con el backend vía `src/storageApi.js`.
- Deploy: interfaz y APIs en Vercel Hobby; base de datos y acceso con Google
  en Supabase Free. Ver `DEPLOY-VERCEL.md` para la configuración actual.
- Ver `modulo-entrenamiento/README.md` para el paso a paso completo.

### `comparador-precios/`
Backend + interfaz web que busca un suplemento en varias tiendas argentinas
(Entreno, Morashop, Farmacity, SelmaDigital, Nutrishop) y compara precio,
ofertas, envío y precio por kg. Node.js/Express, sin dependencias externas
pagas (no llama a ninguna API de IA ni servicio de pago).

- Scraping por tienda: Tiendanube (Entreno, Morashop, Nutrishop) vía JSON-LD
  con fallback a HTML; VTEX (Farmacity, account `farmacityar`) vía su API
  pública de catálogo; Drubbit eCommerce (SelmaDigital) vía `/shop?search=`.
- Incluye: corrector ortográfico simple (diccionario + distancia de
  Levenshtein), filtro de relevancia/formato/tamaño, orden por precio o
  precio/kg, favoritos (localStorage), panel de detalle.
- Ver `comparador-precios/README.md` para cómo correrlo y deployarlo.

## Estética

Las dos apps comparten una misma línea visual, inspirada en MacroFactor:
fondo casi negro, tarjetas planas sin sombra, acento azul (`#3B82F6`),
tipografía Inter, segmented controls en vez de tabs subrayados.

## Lecciones aprendidas scrapeando (ver `comparador-precios/` en detalle)

- Los montos de cuotas pueden colarse como si fueran el precio real — se
  resuelve borrando la frase completa de cuotas antes de extraer precios,
  más una verificación matemática que rechaza descuentos de más del 60%.
- La identificación de plataforma hay que verificarla contra el HTML real
  (SelmaDigital se creyó VTEX al principio; en realidad es Drubbit).
