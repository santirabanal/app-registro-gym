import express from "express";
import cors from "cors";
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
import http from 'node:http';
import {resolve} from 'node:path';
import { sites, searchSite } from "./adapters/index.js";
import {
  cacheGet,
  cacheSet,
  normalizeQuery,
  filterByRelevance,
  filterByFormat,
  filterBySize,
  pricePerKg,
  correctQuery,
  isComparableProduct,
} from "./utils.js";

const app = express();
app.use(cors());
app.use('/api', (req,res)=>{
 const upstream=http.request(new URL(req.url, process.env.TRAINING_API_URL || 'http://127.0.0.1:3002'),{method:req.method,headers:{...req.headers,host:'127.0.0.1:3002'}},response=>{
  res.writeHead(response.statusCode,response.headers);response.pipe(res);
 });
 upstream.setTimeout(12000,()=>upstream.destroy());
 upstream.on('error',()=>{if(!res.headersSent)res.status(502).json({error:'El servicio de entrenamiento no está disponible'});else res.end();});
 req.pipe(upstream);
});
const publicPath = fileURLToPath(new URL('./public/', import.meta.url));
const dashboardPath = fileURLToPath(new URL('../modulo-entrenamiento/frontend/dist/', import.meta.url));
app.use('/suplementos', express.static(publicPath));
app.use(express.static(existsSync(dashboardPath) ? dashboardPath : publicPath));

app.get("/health", (_req, res) => {
  res.json({ ok: true, tiendas: sites.map((s) => s.siteName) });
});

app.get(["/search", "/suplementos/search"], async (req, res) => {
  const qRaw = req.query.q;
  if (!qRaw || typeof qRaw !== "string" || qRaw.trim().length < 2) {
    return res.status(400).json({ error: "Falta el parámetro 'q' (búsqueda de al menos 2 caracteres)" });
  }

  const { corrected, changed } = correctQuery(qRaw.trim());
  const q = changed ? corrected : qRaw.trim();

  const key = normalizeQuery(q);
  const cached = cacheGet(key);
  if (cached) {
    return res.json({ ...cached, correctedFrom: changed ? qRaw.trim() : null, fromCache: true });
  }

  const settled = await Promise.allSettled(
    sites.map((site) => searchSite(site, q))
  );

  const results = [];
  const errors = [];

  settled.forEach((outcome, i) => {
    const site = sites[i];
    if (outcome.status === "fulfilled") {
      const withShipping = outcome.value.map((r) => ({
        ...r,
        offers: r.offers || [],
        shippingInfo: site.shippingInfo || "Sin datos de envío para esta tienda",
      }));
      results.push(...withShipping);
    } else {
      errors.push({ siteName: site.siteName, error: outcome.reason?.message || String(outcome.reason) });
    }
  });

  // Orden por precio ascendente (los sin precio quedan al final)
  let relevantes = filterByRelevance(results, q);
  relevantes = filterByFormat(relevantes, q);
  relevantes = filterBySize(relevantes, q);
  relevantes = relevantes.map((r) => ({ ...r, pricePerKg: pricePerKg(r.price, r.productName) }));
  relevantes.sort((a, b) => {
    const key = (x) => x.pricePerKg ?? Infinity;
    return key(a) - key(b);
  });

  const recommendation = buildRecommendation(relevantes.filter((r) => isComparableProduct(r, q)));

  const payload = {
    query: q,
    correctedFrom: changed ? qRaw.trim() : null,
    results: relevantes,
    errors,
    recommendation,
    fromCache: false,
  };
  cacheSet(key, payload);

  res.json(payload);
});

// Recomendación: cuando se puede calcular el precio por kg de al menos
// un resultado, se recomienda por ahí (compara justo formatos distintos).
// Si no se puede calcular para ninguno, se cae al precio absoluto más bajo.
function buildRecommendation(results) {
  const withPrice = results.filter((r) => r.price != null);
  if (withPrice.length === 0) return null;

  const withPerKg = withPrice.filter((r) => r.pricePerKg != null);
  const pool = withPerKg.length > 0 ? withPerKg : withPrice;
  const sorted = [...pool].sort((a, b) => (a.pricePerKg ?? a.price) - (b.pricePerKg ?? b.price));
  const best = sorted[0];

  const close = sorted.filter((r) => {
    const key = (x) => x.pricePerKg ?? x.price;
    return key(r) <= key(best) * 1.03 && r !== best;
  });

  const perKgNote = best.pricePerKg
    ? ` (≈ $${Math.round(best.pricePerKg).toLocaleString("es-AR")}/kg)`
    : "";

  return {
    siteName: best.siteName,
    productName: best.productName,
    price: best.price,
    reason:
      (withPerKg.length > 0
        ? `Mejor precio por kg entre las tiendas consultadas${perKgNote}`
        : "Precio más bajo encontrado entre las tiendas consultadas") +
      (close.length > 0
        ? ` — hay ${close.length} opción(es) muy cerca, revisá el envío de cada una`
        : ""),
  };
}

const PORT = process.env.PORT || 3001;
export default app;
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) app.listen(PORT, () => {
  console.log(`Comparador de precios corriendo en http://localhost:${PORT}`);
  console.log(`Abrí http://localhost:${PORT} en el navegador para usar la interfaz`);
});
