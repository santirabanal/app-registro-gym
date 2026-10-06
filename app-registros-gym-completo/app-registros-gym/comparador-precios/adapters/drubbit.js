import * as cheerio from "cheerio";
import { parsePriceAR, parseOffers, cardScope, extractCleanPrices, resolvePriceAndListPrice } from "../utils.js";

// Adaptador para tiendas montadas sobre "Drubbit eCommerce" (confirmado
// como la plataforma de selmadigital.com por su meta-generator).
// URL de búsqueda confirmada para SelmaDigital: /shop?search={query}
//
// Estrategia: primero intenta JSON-LD (más estable), y si no encuentra
// nada cae a scraping de HTML con selectores genéricos sobre links a
// "/p/" (confirmado que esa es la estructura de URL de producto).

export async function drubbitSearch({ siteName, siteUrl }, query) {
  const url = `${siteUrl.replace(/\/$/, "")}/shop?search=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ComparadorPrecios/1.0)" },
  });

  if (!res.ok) {
    throw new Error(`${siteName}: la tienda respondió ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const cardMeta = extractCardMeta($, siteUrl);

  const fromJsonLd = extractFromJsonLd($, siteName);
  if (fromJsonLd.length > 0) {
    return fromJsonLd.map((r) => enrichWithCardMeta(r, cardMeta));
  }

  return extractFromHtml($, siteName, siteUrl);
}

function enrichWithCardMeta(result, cardMeta) {
  const meta = cardMeta.get(normalizeUrl(result.productUrl));
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

function extractFromJsonLd($, siteName) {
  const results = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    let data;
    try {
      data = JSON.parse($(el).contents().text());
    } catch {
      return;
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
          inStock: offer?.availability ? !/outofstock/i.test(offer.availability) : true,
        });
      }
    }
  });

  return results.filter((r) => r.productName && r.price != null);
}

function extractCardMeta($, siteUrl) {
  const map = new Map();
  $('a[href*="/p/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    if (!href) return;
    const fullUrl = href.startsWith("http") ? href : `${siteUrl.replace(/\/$/, "")}${href}`;
    const $card = $el.closest('.product-card').length ? $el.closest('.product-card') : cardScope($, $el);
    const cardText = $card.text();
    const brand = $card.find('[itemprop="brand"]').first().text().trim() || null;
    map.set(normalizeUrl(fullUrl), {
      offers: parseOffers(cardText),
      brand,
      prices: extractCleanPrices(cardText),
    });
  });
  return map;
}

function extractFromHtml($, siteName, siteUrl) {
  const results = [];

  // AJUSTAR SI HACE FALTA: asume que cada producto es un link a una URL
  // que contiene "/p/" (confirmado en las páginas de producto de
  // SelmaDigital, ej. /p/nombre-del-producto/uuid).
  $('a[href*="/p/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    if (!href) return;

    const $card = $el.closest('.product-card').length ? $el.closest('.product-card') : cardScope($, $el);
    const cardText = $card.text().replace(/\s+/g, ' ');
    const prices = extractCleanPrices(cardText);
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
      imageUrl: $card.find("img").first().attr("src") || null,
      inStock: !/sin stock|agotado/i.test(cardText),
      offers: parseOffers(cardText),
    });
  });

  const seen = new Set();
  return results.filter((r) => {
    if (seen.has(r.productUrl)) return false;
    seen.add(r.productUrl);
    return true;
  });
}
