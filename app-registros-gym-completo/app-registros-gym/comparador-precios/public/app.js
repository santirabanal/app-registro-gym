// ---------- Estado ----------
let lastResults = [];
let lastRecommendation = null;
let selectedProduct = null;
const FAVORITES_KEY = `comparador:favoritos:${new URLSearchParams(location.search).get('user') || 'local'}`;

// ---------- Elementos ----------
const form = document.getElementById("search-form");
const input = document.getElementById("query");
const statusEl = document.getElementById("status");
const recommendationEl = document.getElementById("recommendation");
const resultsEl = document.getElementById("results");
const detailWrap = document.getElementById("detail-panel-wrap");
const sortSelect = document.getElementById("sort-select");
const minPriceInput = document.getElementById("min-price");
const maxPriceInput = document.getElementById("max-price");
const tabSearch = document.getElementById("tab-search");
const tabFavorites = document.getElementById("tab-favorites");
const searchView = document.getElementById("search-view");
const favoritesView = document.getElementById("favorites-view");
const favoritesList = document.getElementById("favorites-list");

const money = (n) =>
  n == null ? "—" : n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

// ---------- Favoritos (localStorage) ----------
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function isFavorite(productUrl) {
  return loadFavorites().some((f) => f.productUrl === productUrl);
}

function toggleFavorite(r) {
  const favs = loadFavorites();
  const idx = favs.findIndex((f) => f.productUrl === r.productUrl);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push({
      siteName: r.siteName,
      productName: r.productName,
      brand: r.brand,
      productUrl: r.productUrl,
      imageUrl: r.imageUrl,
      price: r.price,
      pricePerKg: r.pricePerKg,
      savedAt: new Date().toISOString(),
    });
  }
  saveFavorites(favs);
}

// ---------- Tabs ----------
tabSearch.addEventListener("click", () => switchTab("search"));
tabFavorites.addEventListener("click", () => switchTab("favorites"));

function switchTab(tab) {
  const isSearch = tab === "search";
  tabSearch.classList.toggle("active", isSearch);
  tabFavorites.classList.toggle("active", !isSearch);
  searchView.hidden = !isSearch;
  favoritesView.hidden = isSearch;
  if (!isSearch) renderFavorites();
}

// ---------- Búsqueda ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (q.length < 2) return;
  await runSearch(q);
});

sortSelect.addEventListener("change", () => renderCurrentResults());
minPriceInput.addEventListener("input", () => renderCurrentResults());
maxPriceInput.addEventListener("input", () => renderCurrentResults());

async function runSearch(q) {
  setStatus(`Buscando "${q}" en las tiendas...`, false);
  recommendationEl.hidden = true;
  resultsEl.innerHTML = "";
  selectedProduct = null;
  renderDetailPanel();
  form.querySelector("button").disabled = true;

  try {
    const res = await fetch(`./search?q=${encodeURIComponent(q)}`);
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Ocurrió un error en la búsqueda.", true);
      return;
    }

    lastResults = data.results;
    lastRecommendation = data.recommendation;
    renderStatusLine(data);
    renderCurrentResults();
  } catch (err) {
    setStatus("No se pudo conectar con el servidor. ¿Está corriendo npm run dev?", true);
  } finally {
    form.querySelector("button").disabled = false;
  }
}

function renderStatusLine(data) {
  const { results, errors, correctedFrom } = data;
  const parts = [];
  if (correctedFrom) {
    parts.push(`Mostrando resultados para "${data.query}" (corregido de "${correctedFrom}")`);
  }
  if (results.length > 0) parts.push(`${results.length} producto(s) encontrado(s)`);
  if (errors.length > 0) {
    parts.push(`${errors.length} tienda(s) no respondieron (${errors.map((e) => e.siteName).join(", ")})`);
    if (errors.some(e=>/DNS/.test(e.error))) parts.push('Una tienda no está accesible por su dominio; sus precios no se incluyen');
  }
  if (results.length === 0) {
    setStatus(parts.concat("No se encontraron resultados. Probá con otro término de búsqueda.").join(" · "), errors.length > 0);
    return;
  }
  setStatus(parts.join(" · "), false);
}

function setStatus(text, isError) {
  statusEl.hidden = false;
  statusEl.textContent = text;
  statusEl.className = "status" + (isError ? " error" : "");
}

// ---------- Orden y filtro (client-side, sobre lastResults) ----------
function renderCurrentResults() {
  if (lastResults.length === 0) return;

  const min = minPriceInput.value ? Number(minPriceInput.value) : null;
  const max = maxPriceInput.value ? Number(maxPriceInput.value) : null;

  let filtered = lastResults.filter((r) => {
    if (r.price == null) return true;
    if (min != null && r.price < min) return false;
    if (max != null && r.price > max) return false;
    return true;
  });

  const sortBy = sortSelect.value;
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "brand") {
      return (a.brand || "zzz").localeCompare(b.brand || "zzz");
    }
    if (sortBy === "price") {
      return (a.price ?? Infinity) - (b.price ?? Infinity);
    }
    // Los productos sin peso conocido van al final: precio y precio/kg tienen unidades distintas.
    return (a.pricePerKg ?? Infinity) - (b.pricePerKg ?? Infinity) || (a.price ?? Infinity) - (b.price ?? Infinity);
  });

  renderResults(filtered);
}

function renderResults(results) {
  if (lastRecommendation) {
    recommendationEl.hidden = false;
    recommendationEl.innerHTML = `
      💡 <strong>Te conviene comprar en ${escapeHtml(lastRecommendation.siteName)}</strong> —
      ${escapeHtml(lastRecommendation.productName)} a ${money(lastRecommendation.price)}.
      <div style="margin-top:4px; color:var(--ink-soft)">${escapeHtml(lastRecommendation.reason)}</div>
    `;
  } else {
    recommendationEl.hidden = true;
  }

  if (results.length === 0) {
    resultsEl.innerHTML = `<p style="color:var(--ink-soft); font-size:14px;">Ningún resultado dentro de ese rango de precio.</p>`;
    return;
  }

  const bestUrl = lastRecommendation
    ? lastResults.find((r) => r.siteName === lastRecommendation.siteName && r.productName === lastRecommendation.productName)?.productUrl
    : null;

  resultsEl.innerHTML = results.map((r) => renderCard(r, r.productUrl === bestUrl)).join("");

  resultsEl.querySelectorAll(".result-card").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".star-btn") || e.target.closest(".result-actions")) return;
      const url = el.dataset.url;
      const product = lastResults.find((r) => r.productUrl === url);
      if (product) selectProduct(product);
    });
  });

  resultsEl.querySelectorAll(".star-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = btn.dataset.url;
      const product = lastResults.find((r) => r.productUrl === url);
      if (product) {
        toggleFavorite(product);
        renderCurrentResults();
        if (selectedProduct?.productUrl === url) renderDetailPanel();
      }
    });
  });
}

function renderCard(r, isBest) {
  const offersHtml =
    r.offers && r.offers.length > 0
      ? `<div class="offers">${r.offers.map((o) => `<span class="offer-tag">${escapeHtml(o)}</span>`).join("")}</div>`
      : "";

  const listPriceHtml =
    r.listPrice && r.listPrice > r.price ? `<span class="list-price">${money(r.listPrice)}</span>` : "";

  const perKgHtml = r.pricePerKg ? `<span class="price-per-kg">≈ ${money(Math.round(r.pricePerKg))}/kg</span>` : "";

  const displayName =
    r.brand && r.productName?.toLowerCase().startsWith(r.brand.toLowerCase())
      ? r.productName
      : `${r.brand ? r.brand + " " : ""}${r.productName}`;

  const fav = isFavorite(r.productUrl);

  return `
    <div class="result-card${isBest ? " best" : ""}" data-url="${escapeAttr(r.productUrl)}">
      ${r.imageUrl ? `<img class="result-image" src="${escapeAttr(r.imageUrl)}" alt="" loading="lazy" onerror="this.style.display='none'" />` : '<div class="result-image placeholder"></div>'}
      <div class="result-body">
        <div class="result-site-row">
          <div class="result-site">${escapeHtml(r.siteName)}</div>
          <button class="star-btn${fav ? " active" : ""}" data-url="${escapeAttr(r.productUrl)}" title="Guardar en favoritos">${fav ? "★" : "☆"}</button>
        </div>
        <div class="result-price">${listPriceHtml}${money(r.price)}${perKgHtml}</div>
        <div class="result-name">${escapeHtml(displayName)}</div>
        <div class="result-meta">
          🚚 ${escapeHtml(r.shippingInfo || "Sin datos de envío")}
          ${r.inStock === false ? '<span class="out-of-stock"> · Sin stock</span>' : ""}
        </div>
        ${offersHtml}
        <div class="result-actions">
          <a href="${escapeAttr(r.productUrl)}" target="_blank" rel="noopener noreferrer">Ir a comprar →</a>
        </div>
      </div>
    </div>
  `;
}

// ---------- Panel de detalle ----------
function selectProduct(product) {
  selectedProduct = product;
  renderDetailPanel();
  renderCurrentResults();
}

function renderDetailPanel() {
  if (!selectedProduct) {
    detailWrap.innerHTML = "";
    return;
  }
  const r = selectedProduct;
  const fav = isFavorite(r.productUrl);
  const listPriceHtml = r.listPrice && r.listPrice > r.price ? `<span class="list-price">${money(r.listPrice)}</span>` : "";
  const offersHtml =
    r.offers && r.offers.length > 0
      ? `<div class="offers" style="margin-top:10px;">${r.offers.map((o) => `<span class="offer-tag">${escapeHtml(o)}</span>`).join("")}</div>`
      : "";

  detailWrap.innerHTML = `
    <div class="detail-panel">
      <button class="close-btn" id="detail-close">✕ Cerrar</button>
      ${r.imageUrl ? `<img src="${escapeAttr(r.imageUrl)}" alt="" onerror="this.style.display='none'" />` : ""}
      <div class="detail-site">${escapeHtml(r.siteName)}</div>
      <h3>${escapeHtml(r.brand ? `${r.brand} ${r.productName}` : r.productName)}</h3>
      <div class="detail-price">${listPriceHtml}${money(r.price)}</div>
      ${offersHtml}
      <div class="detail-row">🚚 ${escapeHtml(r.shippingInfo || "Sin datos de envío")}</div>
      ${r.pricePerKg ? `<div class="detail-row">≈ ${money(Math.round(r.pricePerKg))} por kg</div>` : ""}
      ${r.inStock === false ? `<div class="detail-row" style="color:var(--down)">Sin stock</div>` : ""}
      <button class="star-btn${fav ? " active" : ""}" id="detail-fav" style="margin-top:12px; font-size:22px;">${fav ? "★ Guardado en favoritos" : "☆ Guardar en favoritos"}</button>
      <a class="btn-primary" href="${escapeAttr(r.productUrl)}" target="_blank" rel="noopener noreferrer">Ir a comprar →</a>
    </div>
  `;

  document.getElementById("detail-close").addEventListener("click", () => {
    selectedProduct = null;
    renderDetailPanel();
    renderCurrentResults();
  });
  document.getElementById("detail-fav").addEventListener("click", () => {
    toggleFavorite(r);
    renderDetailPanel();
    renderCurrentResults();
  });
}

// ---------- Vista de Favoritos ----------
function renderFavorites() {
  const favs = loadFavorites();
  if (favs.length === 0) {
    favoritesList.innerHTML = `<p class="empty-favorites">Todavía no guardaste productos. Tocá la ☆ en un resultado de búsqueda para guardarlo.</p>`;
    return;
  }

  favoritesList.innerHTML = `
    <div style="margin-bottom:16px;">
      <button class="btn-primary-inline" id="check-prices-btn" style="background:var(--accent); color:#17110B; border:none; border-radius:10px; padding:10px 18px; font-weight:700; font-size:14px; cursor:pointer; font-family:inherit;">
        Revisar precios actuales
      </button>
    </div>
    <div id="favorites-cards"></div>
  `;

  renderFavoriteCards(favs);

  document.getElementById("check-prices-btn").addEventListener("click", async (e) => {
    e.target.disabled = true;
    e.target.textContent = "Revisando...";
    await checkFavoritePrices(favs);
    e.target.disabled = false;
    e.target.textContent = "Revisar precios actuales";
  });
}

function renderFavoriteCards(favs, priceChecks = {}) {
  const container = document.getElementById("favorites-cards");
  container.innerHTML = favs
    .map((f) => {
      const check = priceChecks[f.productUrl];
      let alertHtml = "";
      if (check) {
        if (check.notFound) {
          alertHtml = `<div class="favorite-alert" style="color:var(--ink-soft)">No se encontró en la búsqueda actual (puede que ya no esté disponible)</div>`;
        } else if (check.price < f.price) {
          alertHtml = `<div class="favorite-alert">¡Bajó de precio! Era ${money(f.price)}, ahora ${money(check.price)}</div>`;
        } else if (check.offers && check.offers.length > 0) {
          alertHtml = `<div class="favorite-alert" style="color:var(--accent)">Tiene ofertas activas: ${check.offers.map(escapeHtml).join(", ")}</div>`;
        } else {
          alertHtml = `<div class="favorite-alert" style="color:var(--ink-soft)">Sin cambios (${money(check.price)})</div>`;
        }
      }
      return `
        <div class="result-card">
          ${f.imageUrl ? `<img class="result-image" src="${escapeAttr(f.imageUrl)}" alt="" onerror="this.style.display='none'" />` : '<div class="result-image placeholder"></div>'}
          <div class="result-body">
            <div class="result-site-row">
              <div class="result-site">${escapeHtml(f.siteName)}</div>
              <button class="star-btn active" data-url="${escapeAttr(f.productUrl)}" title="Quitar de favoritos">★</button>
            </div>
            <div class="result-price">${money(f.price)}</div>
            <div class="result-name">${escapeHtml(f.brand ? `${f.brand} ${f.productName}` : f.productName)}</div>
            <div class="result-meta">Guardado el ${new Date(f.savedAt).toLocaleDateString("es-AR")}</div>
            ${alertHtml}
            <div class="result-actions">
              <a href="${escapeAttr(f.productUrl)}" target="_blank" rel="noopener noreferrer">Ir a comprar →</a>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".star-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const favs = loadFavorites();
      const idx = favs.findIndex((f) => f.productUrl === btn.dataset.url);
      if (idx >= 0) favs.splice(idx, 1);
      saveFavorites(favs);
      renderFavorites();
    });
  });
}

async function checkFavoritePrices(favs) {
  const priceChecks = {};
  // Secuencial (no en paralelo) para no golpear todas las tiendas a la vez.
  for (const f of favs) {
    try {
      const res = await fetch(`./search?q=${encodeURIComponent(f.productName)}`);
      const data = await res.json();
      const match = (data.results || []).find((r) => r.productUrl === f.productUrl);
      priceChecks[f.productUrl] = match ? { price: match.price, offers: match.offers } : { notFound: true };
    } catch {
      priceChecks[f.productUrl] = { notFound: true };
    }
  }
  renderFavoriteCards(favs, priceChecks);
}

// ---------- Utils ----------
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str ?? "").replace(/"/g, "&quot;");
}
