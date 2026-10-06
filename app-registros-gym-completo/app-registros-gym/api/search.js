import app from '../comparador-precios/server.js';
export default function handler(req,res) {
 const q=req.query?.q || new URL(req.url,'http://localhost').searchParams.get('q') || '';
 req.url=`/search?${new URLSearchParams({q})}`;
 return app(req,res);
}
