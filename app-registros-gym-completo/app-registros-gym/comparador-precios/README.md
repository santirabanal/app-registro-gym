# Comparador de precios de suplementos

Backend que busca un producto en varias tiendas argentinas de suplementos y
devuelve los resultados ordenados por precio. Corre gratis, sin necesidad de
Cursor ni ninguna suscripción — solo necesitás tener Node.js instalado.

## 1. Instalar Node.js (una sola vez)

Si no lo tenés: bajalo de https://nodejs.org (versión LTS) e instalalo como
cualquier programa. Después, en una terminal, confirmá que quedó instalado:

```
node --version
```

Tiene que mostrar `v18` o más.

## 2. Instalar las dependencias del proyecto

Abrí una terminal dentro de esta carpeta (`comparador-precios`) y corré:

```
npm install
```

Esto descarga Express, Cheerio y CORS — todo gratis, sin cuenta ni API key.

## 3. Correrlo local

```
npm run dev
```

Vas a ver algo como:

```
Comparador de precios corriendo en http://localhost:3001
```

Abrí **http://localhost:3001** en el navegador — ahí está la interfaz:
buscador, tarjetas con precio, ofertas, info de envío y link para comprar,
con la recomendación de dónde conviene más arriba de todo.

## 4. Nota sobre SelmaDigital

Corre en una plataforma llamada "Drubbit eCommerce" (no VTEX). La URL de
búsqueda confirmada es `selmadigital.com/shop?search={query}`.

## 5. Si una tienda no devuelve resultados

Es esperable la primera vez — los selectores de scraping (Tiendanube) y el
"account" de VTEX (Farmacity, SelmaDigital) están marcados como
`TODO` / `AJUSTAR SI HACE FALTA` en el código porque necesitan verificarse
contra el sitio real. Pasos:

1. Corré la búsqueda y mirá qué tienda da error (aparece en `errors` en la
   respuesta JSON).
2. Para VTEX (Farmacity/SelmaDigital): abrí el sitio en el navegador, F12 →
   pestaña "Red"/"Network", buscá algo, y fijate si alguna request tiene
   `vtexcommercestable.com.br` en la URL — el `account` es el subdominio.
   Actualizalo en `adapters/index.js`.
3. Para Tiendanube (Entreno/Morashop): si el JSON-LD no trae nada, el
   scraping de respaldo busca links a `/productos/` — si tampoco encuentra
   nada, inspeccioná una tarjeta de producto con F12 y ajustá el selector
   marcado en `adapters/tiendanube.js`.
4. Si te trabás en cualquiera de estos pasos, pegame acá el HTML o el error
   que te muestra y te ayudo a ajustar el selector puntual.

## 5. Sumar las tiendas que faltan

En `adapters/index.js` hay un ejemplo de cómo agregar una tienda nueva
Tiendanube o VTEX. Para una plataforma distinta a esas dos, pasame la URL y
te armo el adaptador.

## 6. Subirlo gratis a internet (para que tu app pueda usarlo)

Mientras lo tengas corriendo solo en tu máquina (`localhost`), únicamente vos
lo podés usar. Para que la app de entrenamiento (u otra parte del dashboard)
lo consulte desde cualquier lado, hay que desplegarlo. Opciones gratuitas:

- **Render** (render.com): plan free para "Web Services" — conectás tu
  repo de GitHub, elegís Node, y listo. Se "duerme" tras un rato sin uso
  (tarda unos segundos en despertar en la primera request).
- **Railway** (railway.app): tiene un plan gratuito con horas limitadas
  por mes, suficiente para uso personal.
- **Fly.io**: plan gratuito chico, un poco más técnico de configurar.

Cualquiera de las tres sirve para este proyecto. Si querés, cuando llegues a
ese paso te guío con el despliegue específico.

## Estructura del proyecto

```
comparador-precios/
├── server.js              # servidor Express, endpoint /search y sirve la interfaz
├── utils.js                # parseo de precios, ofertas y caché en memoria
├── public/
│   ├── index.html           # interfaz del comparador
│   ├── style.css
│   └── app.js
├── adapters/
│   ├── index.js             # lista de tiendas configuradas (con su info de envío)
│   ├── tiendanube.js        # adaptador genérico Tiendanube
│   ├── vtex.js               # adaptador genérico VTEX
│   └── drubbit.js           # adaptador para SelmaDigital
└── package.json
```

## Sobre el envío

No se calcula por código postal — cada tienda usa su propio transportista y
calculador, sería frágil intentar reproducirlo. En cambio, se muestra la
política general de envío gratis que cada tienda publica (ej. "Envío gratis
a CABA/GBA desde $65.000"), para que puedas comparar a ojo. Si alguno de
esos montos cambió desde que lo relevamos, se ajusta en
`adapters/index.js` (campo `shippingInfo` de cada tienda).
