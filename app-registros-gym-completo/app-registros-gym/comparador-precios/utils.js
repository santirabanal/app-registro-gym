// Convierte un precio con formato argentino ("$61.990,00" o "61990") a número.
export function parsePriceAR(text) {
  if (text == null) return null;
  if (typeof text === "number") return text;
  const cleaned = String(text)
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .trim();
  if (!cleaned) return null;

  // Si tiene coma decimal estilo argentino (1.234,56)
  if (/\d+\.\d{3}(,\d+)?$/.test(cleaned) || /,\d{1,2}$/.test(cleaned)) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(normalized);
    return isNaN(n) ? null : n;
  }
  // Si no, asumimos que ya viene en formato "normal" (ej. de una API JSON)
  const n = parseFloat(cleaned.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

// Caché simple en memoria con TTL. Suficiente para un solo proceso;
// si en algún momento corrés varias instancias, cambiar por Redis.
const store = new Map();

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet(key, data, ttlMs = 20 * 60 * 1000) {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function normalizeQuery(q) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

// --- Relevancia: descarta resultados cuyo nombre no tenga que ver con la búsqueda ---
// Se usa porque algunas tiendas devuelven listados genéricos (destacados,
// relacionados) en vez de resultados filtrados por la búsqueda real.
function normalizeText(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // saca acentos
}

export function filterByRelevance(results, query) {
  // Palabras "core": alfabéticas, de al menos 3 letras, sin dígitos.
  // Se ignoran los tokens numéricos/tamaños (ej. "1kg") porque el tamaño
  // exacto varía mucho entre productos igual de relevantes.
  const tokens = normalizeText(query)
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !/\d/.test(t));

  if (tokens.length === 0) return results; // búsqueda muy corta/numérica: no filtramos

  return results.filter((r) => {
    const name = normalizeText(r.productName);
    const nameWords = name.match(/[a-z]+/g) || [];
    if (tokens.includes("whey") && /\bnatural\s+whey\b/.test(name) &&
        !/\b(protein|proteina|proteinas)\b/.test(name.replace(/\bnatural\s+whey\b/g, ""))) return false;
    return tokens.every((t) => fuzzyWordMatch(nameWords, t));
  });
}

// --- Tolerancia a errores de tipeo ---
// Distancia de edición (Levenshtein): cuenta cuántas letras hay que
// cambiar/agregar/sacar para pasar de una palabra a otra. "protain" vs
// "protein" = 1 cambio; "wey" vs "whey" = 1 letra agregada. Con eso
// alcanza para tolerar errores de tipeo comunes sin volverse demasiado
// permisivo con palabras genuinamente distintas.
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function fuzzyWordMatch(nameWords, token) {
  const aliases = {creatina: ["creatina", "creatine"], creatine: ["creatina", "creatine"],
    proteina: ["proteina", "proteinas", "protein"], protein: ["proteina", "proteinas", "protein"]};
  return nameWords.some((w) => (aliases[token] || [token]).includes(w));
}

export function isComparableProduct(result, query) {
  const name = normalizeText(result.productName);
  if (result.inStock === false || !(result.price > 0)) return false;
  if (/\b(creatina|creatine)\b/.test(normalizeText(query))) {
    return !/\b(combo|carbohidratos|electrolitos|glutamina|proteina|protein|capsulas|caps|comp|comprimidos|gomitas|hcl|senior)\b|\+/.test(name);
  }
  return !/\bcombo\b|\+/.test(name);
}

// --- Alcance de la tarjeta de producto ---
// Preferimos el texto del propio link (muchos temas meten todo — imagen,
// nombre, precio — adentro del <a>). Solo si ahí no hay casi texto,
// subimos UN solo nivel al padre inmediato. Nunca más lejos que eso, para
// no terminar leyendo el contenido de varias tarjetas mezcladas (que es
// lo que causaba precios y ofertas de otro producto, o de las cuotas).
export function cardScope($, $el) {
  const productCard = $el.closest('[data-store="product-item"], .js-item-product, .item-product');
  if (productCard.length) return productCard;
  if ($el.text().trim().length >= 3) return $el;
  const parent = $el.parent();
  return parent.length ? parent : $el;
}

// --- Precios limpios: borra las menciones de cuotas antes de buscar precios ---
// (en vez de "ignorar montos cerca de la palabra cuota", que fallaba
// cuando la distancia entre el precio real y la mención de cuotas era
// mayor a la esperada, esto elimina la frase completa de cuotas primero
// — así no importa la distancia ni el orden).
export function extractCleanPrices(text) {
  if (!text) return [];
  const cleaned = text
    .replace(/\d+\s*cuotas?(?:\s+sin\s+inter[eé]s)?(?:\s+de)?\s*\$\s?[\d.,]+/gi, " ")
    .replace(/\$\s?[\d.,]+\s*(?:c\/u|cada una)?\s*x\s*\d+\s*(?:cuotas?|pagos?)/gi, " ")
    .replace(/\d+\s*x\s*\$\s?[\d.,]+/gi, " ")
    .replace(/\d+\s*pagos?(?:\s+sin\s+inter[eé]s)?(?:\s+de)?\s*\$\s?[\d.,]+/gi, " ");
  const matches = cleaned.match(/\$\s?[\d.,]+/g) || [];
  return matches.map(parsePriceAR).filter((p) => p != null);
}

// --- Resuelve precio/precio de lista con control de sanidad ---
// Si además del borrado de arriba se nos sigue colando un valor de cuota
// (el sitio lo escribe de una forma que no anticipamos), un descuento
// "real" de más del 60% es sospechoso — los descuentos habituales en
// estas tiendas rondan 5-30%. En ese caso, descartamos el valor más bajo
// y recalculamos con lo que queda.
export function resolvePriceAndListPrice(prices) {
  if (!prices || prices.length === 0) return { price: null, listPrice: null };
  let sorted = [...prices].sort((a, b) => a - b);
  let price = sorted[0];
  let listPrice = sorted.length > 1 ? sorted[sorted.length - 1] : null;

  while (listPrice && price / listPrice < 0.4 && sorted.length > 2) {
    sorted.shift();
    price = sorted[0];
    listPrice = sorted[sorted.length - 1];
  }
  if (listPrice && price / listPrice < 0.4) {
    // Con dos valores nomás y sigue pareciendo un descuento imposible:
    // mejor mostrar el precio más alto sin marcar descuento, que un
    // número inventado.
    return { price: listPrice, listPrice: null };
  }
  return { price, listPrice: listPrice === price ? null : listPrice };
}

// --- Corrector ortográfico simple para términos de suplementos ---
// No usa ningún servicio externo: compara cada palabra de la búsqueda
// contra un diccionario de términos comunes del rubro y la corrige si
// está lo bastante cerca (distancia de Levenshtein). Deja intactos los
// números/tamaños y las palabras que no se parecen a nada del diccionario
// (nombres de marca, por ejemplo — esos no los podemos adivinar).
const KNOWN_TERMS = [
  "whey", "protein", "proteina", "proteinas", "creatina", "creatine",
  "glutamina", "glutamine", "aminoacidos", "aminoacido", "bcaa", "bcaas",
  "preentreno", "quemador", "quemadores", "multivitaminico",
  "multivitaminicos", "vitaminas", "vitaminico", "colageno", "colagenos",
  "magnesio", "potasio", "caseina", "casein", "gainer", "ganador", "mass",
  "barra", "barras", "bar", "sachet", "doypack", "shaker", "omega",
  "melatonina", "zinc", "hierro", "calcio", "probiotico", "probioticos",
  "fibra", "electrolitos", "cafeina", "taurina", "arginina", "leucina",
  "isolate", "aislada", "concentrada", "hidrolizada",
];

export function correctQuery(query) {
  const words = query.split(/\s+/);
  let changed = false;

  const corrected = words.map((word) => {
    const wNorm = normalizeText(word);
    if (wNorm.length < 3 || /\d/.test(wNorm)) return word; // no tocar números/tamaños ni palabras muy cortas
    if (KNOWN_TERMS.includes(wNorm)) return word; // ya está bien escrita

    let best = null;
    let bestDist = Infinity;
    for (const term of KNOWN_TERMS) {
      const d = levenshtein(wNorm, term);
      if (d < bestDist) {
        bestDist = d;
        best = term;
      }
    }
    const threshold = wNorm.length <= 5 ? 2 : 3;
    if (best && bestDist > 0 && bestDist <= threshold) {
      changed = true;
      return best;
    }
    return word; // no hay nada lo bastante parecido: se deja como está
  });

  return { corrected: corrected.join(" "), changed };
}
export function parseWeightGrams(text) {
  if (!text) return null;
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilos?|g|grs?|gramos|lb|lbs|libras)\b/i);
  if (!match) return null;
  const value = parseFloat(match[1].replace(",", "."));
  if (isNaN(value)) return null;
  const unit = match[2].toLowerCase();
  if (unit.startsWith("kg") || unit.startsWith("kilo")) return value * 1000;
  if (unit.startsWith("lb") || unit.startsWith("libra")) return value * 453.6;
  return value; // g, gr, gramos
}

// --- Precio por kg: para comparar productos de tamaños distintos en
// igualdad de condiciones (un sachet de 25g barato puede salir carísimo
// por kg comparado con un pote grande) ---
export function pricePerKg(price, productName) {
  if (/\bcombo\b|\+/i.test(productName || "")) return null;
  const grams = parseWeightGrams(productName);
  if (!grams || price == null) return null;
  return price / (grams / 1000);
}
export function filterByFormat(results, query) {
  const q = normalizeText(query);
  const askedForBar = /\bbarr?a?s?\b|\bbar\b/i.test(q);
  if (askedForBar) return results;
  return results.filter((r) => !/\bbarr?a?s?\b|\bbar\b/i.test(normalizeText(r.productName)));
}

// --- Filtro de tamaño: si la búsqueda menciona un peso, descarta
// productos muchísimo más chicos (probablemente otro formato/tamaño) ---
export function filterBySize(results, query) {
  const targetGrams = parseWeightGrams(query);
  if (!targetGrams) return results; // la búsqueda no especificó tamaño, no filtramos

  return results.filter((r) => {
    const productGrams = parseWeightGrams(r.productName);
    if (!productGrams) return true; // no se pudo leer el tamaño, no lo descartamos a ciegas
    const ratio = productGrams / targetGrams;
    return ratio >= 0.4 && ratio <= 3; // descarta formatos muy chicos o muy grandes
  });
}

// --- Precio por kilo: para comparar formatos distintos (muestra de 25g
// vs pote de 907g) por lo que realmente importa, no por precio total ---
export function withPricePerKg(result) {
  const grams = parseWeightGrams(result.productName);
  const pricePerKg = grams && result.price != null ? Math.round((result.price / grams) * 1000) : null;
  return { ...result, grams, pricePerKg };
}

// --- Ofertas: extrae frases promocionales de un bloque de texto de tarjeta ---
// Best-effort: junta lo que encuentra, no garantiza cubrir el 100% del
// texto promocional de cada tienda (varía mucho entre sitios). Cuando hay
// cerca una mención de método de pago o día de la semana, la suma a la
// oferta (ej. "20% OFF (con Mercado Pago, Jueves)"). Ojo: esta info a
// veces solo está en la página del producto individual, no en el listado
// — si no aparece acá, puede que simplemente no esté disponible sin
// entrar a cada producto.
const DAY_RE = /(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)/i;
const METHOD_RE = /(mercado\s*pago|visa|mastercard|amex|naranja|cabal|cencosud|tarjetas?(?:\s+seleccionadas)?|efectivo|transferencia)/i;

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function parseOffers(text) {
  if (!text) return [];
  text = text.replace(/\s+/g, " ");
  const found = new Map();

  const triggerPatterns = [
    /(?<!\d)-?\d{1,3}%\s*OFF/gi,
    /\d+\s*[Cc]uotas?\s*[Ss]in\s*inter[eé]s/gi,
    /env[ií]o\s*gratis/gi,
  ];

  for (const re of triggerPatterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[0].includes('%') && Number(m[0].match(/\d+/)?.[0]) > 100) continue;
      const windowStart = Math.max(0, m.index - 30);
      const windowEnd = Math.min(text.length, m.index + m[0].length + 60);
      const window = text.slice(windowStart, windowEnd);

      const day = window.match(DAY_RE)?.[0];
      const method = window.match(METHOD_RE)?.[0];

      let label = m[0].trim();
      const extras = [];
      if (method) extras.push(`con ${capitalize(method.trim())}`);
      if (day) extras.push(capitalize(day.trim()));
      if (extras.length > 0) label += ` (${extras.join(", ")})`;

      found.set(label, true);
    }
  }

  (text.match(/c[oó]digo\s+[A-Z0-9]{3,15}/gi) || []).forEach((c) => found.set(c.trim(), true));
  (text.match(/jueves\s+de\s+suplementos[^.,\n]{0,20}/gi) || []).forEach((s) => found.set(s.trim(), true));

  return Array.from(found.keys());
}
