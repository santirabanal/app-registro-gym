import app from '../modulo-entrenamiento/backend/server.js';
export default function handler(req,res) {
  if(req.query?.health) req.url='/health';
  else if(typeof req.query?.key==='string') req.url=`/kv/${encodeURIComponent(req.query.key)}`;
  else req.url=req.url.replace(/^\/api(?=\/)/,'');
  return app(req,res);
}
