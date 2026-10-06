import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterByRelevance, isComparableProduct, pricePerKg, parseOffers} from './utils.js';
import {tiendanubeSearch} from './adapters/tiendanube.js';
import {drubbitSearch} from './adapters/drubbit.js';
test('creatina excluye pancreatina y acepta el nombre inglés', () => {
 const products = ['Pancreatina x 10', 'Creatina ENA 300g', 'Creatine Monohydrate 300g'].map(productName=>({productName}));
 assert.deepEqual(filterByRelevance(products,'creatina'), products.slice(1));
});

test('tarjeta Tiendanube conserva precio general y condiciones de pago', async () => {
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(`<div class="js-item-product"><a title="Creatina 300 grs" href="/productos/creatina/"><img data-srcset="//cdn.example/product.webp 640w" src="data:image/gif;base64,a"></a><span class="js-price-display">$54.822,00</span><span class="js-compare-price-display">$57.708,00</span><span class="js-payment-discount-price-product">$46.598,70</span><span class="js-payment-discount-name-product">Efectivo en CABA/GBA</span><div style="display:none">Sin stock</div></div>`);
 try {
  const [p]=await tiendanubeSearch({siteName:'Test',siteUrl:'https://example.com'},'creatina');
  assert.equal(p.price,54822);assert.equal(p.listPrice,57708);assert.equal(p.inStock,true);
  assert.equal(p.imageUrl,'https://cdn.example/product.webp');
  assert.match(p.offers[0],/Efectivo en CABA\/GBA/);
  assert.equal(pricePerKg(30000,p.productName),100000);
 } finally {globalThis.fetch=original;}
});

test('SelmaDigital lee precio fuera del enlace e ignora cuotas', async () => {
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(`<div class="product-card"><img src="https://example.com/product.webp"><div><a href="/p/creatina/id">Creatina 300g</a><div>3 Cuotas Sin interés de $ 15.300,00</div><div>$45.900</div></div></div>`);
 try {
  const [p]=await drubbitSearch({siteName:'Test',siteUrl:'https://example.com'},'creatina');
  assert.equal(p.price,45900);assert.equal(p.productName,'Creatina 300g');
  assert.equal(p.imageUrl,'https://example.com/product.webp');
 } finally {globalThis.fetch=original;}
});
test('whey no confunde la marca con proteína', () => {
 const products = ['Magnesio Natural Whey', 'Whey Protein 1kg', 'Proteína Natural Whey 1kg'].map(productName=>({productName}));
 assert.deepEqual(filterByRelevance(products,'whey'), products.slice(1));
});
test('recomendación descarta mezclas, combos y productos sin stock', () => {
 for (const productName of ['Creatina con carbohidratos 1kg', 'Creatina + proteína', 'Creatina HCL cápsulas']) {
  assert.equal(isComparableProduct({productName,price:100},'creatina'),false);
 }
 assert.equal(isComparableProduct({productName:'Creatina monohidrato 300g',price:100,inStock:true},'creatina'),true);
 assert.equal(isComparableProduct({productName:'Creatina 300g',price:100,inStock:false},'creatina'),false);
 assert.equal(pricePerKg(100,'Combo Creatina 300g + Whey 1kg'),null);
});
test('ofertas elimina espacios de HTML', () => {
 assert.deepEqual(parseOffers('-5%\n\t OFF'),['-5% OFF']);
 assert.deepEqual(parseOffers('720% OFF'),[]);
});
