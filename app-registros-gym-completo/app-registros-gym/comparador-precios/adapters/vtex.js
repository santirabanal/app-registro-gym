// Adaptador genérico para cualquier tienda montada sobre VTEX.
// VTEX suele exponer una API pública de catálogo sin autenticación en:
//   https://{account}.vtexcommercestable.com.br/api/catalog_system/pub/products/search/{query}
//
// El "account" NO siempre es igual al dominio visible. Para encontrarlo:
//   1. Abrí el sitio en el navegador, F12 > pestaña "Network" (Red)
//   2. Buscá algo en el sitio
//   3. Fijate en las requests que se disparan — alguna va a tener una URL
//      con "vtexcommercestable.com.br" o "myvtex.com"; el account es el
//      subdominio antes de eso.
//   4. Si no aparece nada así, probá directo:
//      https://{dominio}/api/catalog_system/pub/products/search/{query}
//      (algunos sitios VTEX responden esa ruta en su propio dominio, sin
//      necesidad del subdominio vtexcommercestable).

export async function vtexSearch({ siteName, siteUrl, account, useOwnDomain = false }, query) {
  const base = useOwnDomain
    ? siteUrl
    : `https://${account}.vtexcommercestable.com.br`;

  const url = `${base}/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=0&_to=29`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ComparadorPrecios/1.0)",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`${siteName}: VTEX respondió ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`${siteName}: respuesta inesperada de VTEX`);
  }

  return data.map((p) => {
    const item = p.items?.[0];
    const offer = item?.sellers?.[0]?.commertialOffer;

    // VTEX no siempre trae texto promocional libre, pero sí datos
    // estructurados de los que se puede armar algo parecido:
    const offers = [];
    if (offer?.ListPrice && offer?.Price && offer.ListPrice > offer.Price) {
      const pct = Math.round((1 - offer.Price / offer.ListPrice) * 100);
      offers.push(`${pct}% OFF`);
    }
    (offer?.Teasers || []).forEach((t) => {
      if (t?.Name) offers.push(t.Name);
    });
    if (offer?.Installments?.length) {
      const best = offer.Installments.find((i) => i.InterestRate === 0 && i.NumberOfInstallments > 1);
      if (best) offers.push(`${best.NumberOfInstallments} cuotas sin interés`);
    }

    return {
      siteName,
      productName: p.productName,
      brand: p.brand || null,
      price: offer?.Price ?? null,
      listPrice: offer?.ListPrice ?? null,
      productUrl: `${siteUrl.replace(/\/$/, "")}/${p.linkText}/p`,
      imageUrl: item?.images?.[0]?.imageUrl ?? null,
      inStock: (offer?.AvailableQuantity ?? 0) > 0,
      offers,
    };
  });
}
