import { vtexSearch } from "./vtex.js";
import { tiendanubeSearch } from "./tiendanube.js";
import { drubbitSearch } from "./drubbit.js";

// Cada entrada es una tienda. Para sumar una nueva:
//   - Si es Tiendanube: copiá el bloque de "entreno" y cambiá siteName/siteUrl.
//   - Si es VTEX: copiá el bloque de "farmacity" y cambiá siteName/siteUrl/account.
//   - Si no es ninguna de las dos: hay que escribir un adaptador nuevo
//     (avisame qué plataforma es y te lo armo).

export const sites = [
  {
    siteName: "Entreno",
    siteUrl: "https://www.entreno.com.ar",
    platform: "tiendanube",
    // Info general publicada en el sitio (no se calcula por CP).
    shippingInfo: "Envío gratis a CABA/GBA desde $65.000 · resto del país desde $85.000",
  },
  {
    siteName: "Morashop",
    siteUrl: "https://www.morashop.ar",
    platform: "tiendanube",
    shippingInfo: "Envío gratis a CABA/GBA desde $50.000 · interior del país desde $70.000",
  },
  {
    siteName: "Farmacity",
    siteUrl: "https://www.farmacity.com",
    platform: "vtex",
    // Confirmado: las imágenes de producto se sirven desde
    // farmacityar.vtexassets.com, así que el account es "farmacityar".
    account: "farmacityar",
    shippingInfo: "Envío gratis desde $70.000",
  },
  {
    siteName: "SelmaDigital",
    siteUrl: "https://selmadigital.com",
    // Corrección: NO es VTEX. Corre en una plataforma llamada
    // "Drubbit eCommerce" (confirmado en el meta-generator del HTML).
    platform: "drubbit",
    shippingInfo: "Envío gratis a CABA/GBA desde $85.000",
  },
  {
    siteName: "Nutrishop",
    siteUrl: "https://nutrishop.com.ar",
    platform: "tiendanube",
    shippingInfo: "Envío en el día a CABA/GBA (antes de las 12) · retiro en 7 sucursales",
  },
];

export async function searchSite(site, query) {
  if (site.platform === "tiendanube") {
    try { return await tiendanubeSearch(site, query); }
    catch (error) {
      if (error.cause?.code === 'ENOTFOUND') throw new Error(`${site.siteName}: no se pudo resolver el dominio de la tienda (DNS)`);
      throw error;
    }
  }
  if (site.platform === "vtex") {
    return vtexSearch(site, query);
  }
  if (site.platform === "drubbit") {
    return drubbitSearch(site, query);
  }
  throw new Error(`Plataforma no soportada: ${site.platform}`);
}
