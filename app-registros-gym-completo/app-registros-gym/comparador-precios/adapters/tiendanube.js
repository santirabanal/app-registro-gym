import * as cheerio from "cheerio";
import { parsePriceAR, parseOffers, cardScope, extractCleanPrices, resolvePriceAndListPrice } from "../utils.js";

// Adaptador genérico para cualquier tienda montada sobre Tiendanube
// (confirmado por el footer "Powered by Tiendanube" en entreno.com.ar
// y morashop.ar). Usa la página de búsqueda interna:
//   https://{dominio}/search/?q={query}
//
// Estrategia:
//   1. Buscar bloques JSON-LD (<script type="application/ld+json">) con
//      datos de producto — muchos temas de Tiendanube los incluyen para SEO,
//      y son mucho más estables que depender de clases CSS.
//   2. Si no hay JSON-LD útil, caer a scraping de HTML con selectores
//      genéricos (enlaces a "/productos/"). Estos selectores SON los que
//      con más probabilidad haya que ajustar tienda por tienda —
//      si no devuelve nada, inspeccioná el HTML real con F12 y ajustá
//      el selector marcado abajo como "AJUSTAR SI HACE FALTA".

export async function tiendanubeSearch({ siteName, siteUrl }, query) {
  const url = `${siteUrl.replace(/\/$/, "")}/search/?q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ComparadorPrecios/1.0)" },
  });

  if (!res.ok) {
    throw new Error(`${siteName}: la tienda respondió ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // El HTML de la misma página tiene el texto de ofertas (% OFF, cuotas,
  // etc.) que el JSON-LD no trae — lo extraemos siempre y lo cruzamos por
  // URL con lo que venga de JSON-LD o de HTML puro.
  const cardMeta = extractCardMeta($, siteUrl);

  const fromJsonLd = extractFromJsonLd($, siteName);
  if (fromJsonLd.length > 0) {
    return fromJsonLd.map((r) => enrichWithCardMeta(r, cardMeta));
  }

  return extractFromHtml($, siteName, siteUrl);
}

function enrichWithCardMeta(result, cardMeta) {
  const meta = cardMeta.get(normalizeUrl(result.productUrl));
  // El precio que aparece en el HTML visible refleja descuentos activos
  // que el JSON-LD a veces no actualiza (guarda el precio de lista).
  // Si encontramos precios en la tarjeta HTML, tienen prioridad.
  const htmlPrices = meta?.prices || [];
  const resolved = htmlPrices.length > 0 ? resolvePriceAndListPrice(htmlPrices) : null;
  const price = resolved ? resolved.price : result.price;
  const listPrice = resolved ? resolved.listPrice : result.listPrice;

  return {
    ...result,
    price,
    listPrice,
    offers: meta?.offers || [],
    brand: result.brand || meta?.brand || null,
  };
}

function normalizeUrl(url) {
  return (url || "").replace(/\/$/, "").split("?")[0];
}

function cardPrices($card, cardText) {
  const price = parsePriceAR($card.find('.js-price-display').first().text());
  const list = parsePriceAR($card.find('.js-compare-price-display').first().text());
  if (price > 0) return [price, list].filter(p=>p>0);
  return extractCleanPrices(cardText).filter(p=>p>0);
}

function cardOffers($card, cardText) {
  const offers = parseOffers($card.find('.js-labels-floating-group, .labels, .js-max-installments-container').text());
  const amount = parsePriceAR($card.find('.js-payment-discount-price-product').first().text());
  const condition = $card.find('.js-payment-discount-name-product').first().text().replace(/\s+/g,' ').trim();
  if (amount > 0 && condition) offers.push(`$${amount.toLocaleString('es-AR')} con ${condition}`);
  return offers.length ? offers : parseOffers(cardText);
}

function productImage($, $card, siteUrl) {
  for (const image of $card.find('img').toArray()) {
    const el = $(image);
    const srcset = el.attr('data-srcset') || el.attr('srcset');
    const candidates = [el.attr('data-src'), srcset?.split(',').pop()?.trim().split(/\s+/)[0], el.attr('src')];
    for (const src of candidates) {
      if (!src || /^(data:)|carrito\.svg|placeholder/i.test(src)) continue;
      try { return new URL(src, siteUrl).href; } catch {}
    }
  }
  return null;
}

function extractFromJsonLd($, siteName) {
  const results = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    let data;
    try {
      data = JSON.parse($(el).contents().text());
    } catch {
      return; // JSON-LD roto o incompleto, seguimos con el siguiente
    }

    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      const products =
        item["@type"] === "ItemList"
          ? (item.itemListElement || []).map((x) => x.item || x)
          : item["@type"] === "Product"
          ? [item]
          : [];

      for (const p of products) {
        if (!p || p["@type"] !== "Product") continue;
        const offer = Array.isArray(p.offers) ? p.offers[0] : p.offers;
        results.push({
          siteName,
          productName: p.name,
          brand: typeof p.brand === "string" ? p.brand : p.brand?.name || null,
          price: parsePriceAR(offer?.price),
          listPrice: null,
          productUrl: p.url || offer?.url || null,
          imageUrl: Array.isArray(p.image) ? p.image[0] : p.image ?? null,
          inStock: offer?.availability
            ? !/outofstock/i.test(offer.availability)
            : true,
        });
      }
    }
  });

  return results.filter((r) => r.productName && r.price != null);
}

// Recorre las mismas tarjetas de producto del HTML, pero solo para sacar
// ofertas y marca (no precio/nombre) — se usa para completar los
// resultados que vinieron de JSON-LD.
function extractCardMeta($, siteUrl) {
  const map = new Map();
  $('a[href*="/productos/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    if (!href) return;
    const fullUrl = href.startsWith("http") ? href : `${siteUrl.replace(/\/$/, "")}${href}`;
    const $card = cardScope($, $el);
    const cardText = $card.text().replace(/\s+/g, ' ');
    const brand = $card.find('[itemprop="brand"]').first().text().trim() || null;
    map.set(normalizeUrl(fullUrl), {
      offers: cardOffers($card, cardText),
      brand,
      prices: cardPrices($card, cardText),
    });
  });
  return map;
}

function extractFromHtml($, siteName, siteUrl) {
  const results = [];

  // AJUSTAR SI HACE FALTA: este selector asume que cada producto es un link
  // a una URL que contiene "/productos/". Si la tienda no devuelve nada,
  // abrí la página de búsqueda en el navegador, F12 > Elements, ubicá una
  // tarjeta de producto y reemplazá este selector por el real.
  $('a[href*="/productos/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    if (!href) return;

    // Alcance ajustado: el propio link, o como mucho su padre inmediato
    // (ver cardScope en utils.js — evita mezclar con otras tarjetas).
    const $card = cardScope($, $el);
    const cardText = $card.text().replace(/\s+/g, ' ');
    const prices = cardPrices($card, cardText);
    if (prices.length === 0) return;

    const name = $el.attr("title") || $el.text().trim() || $card.find("h2, h3").first().text().trim();
    if (!name) return;

    const { price, listPrice } = resolvePriceAndListPrice(prices);

    results.push({
      siteName,
      productName: name,
      brand: $card.find('[itemprop="brand"]').first().text().trim() || null,
      price,
      listPrice,
      productUrl: href.startsWith("http") ? href : `${siteUrl.replace(/\/$/, "")}${href}`,
      imageUrl: productImage($, $card, siteUrl),
      inStock: !/sin stock|agotado/i.test($card.clone().find('[style*="display:none"], [style*="display: none"], .hidden').remove().end().text()),
      offers: cardOffers($card, cardText),
    });
  });

  // Deduplicar por URL (un mismo producto puede aparecer más de una vez
  // si el link de imagen y el de texto matchean el mismo selector)
  const seen = new Set();
  return results.filter((r) => {
    if (seen.has(r.productUrl)) return false;
    seen.add(r.productUrl);
    return true;
  });
}
