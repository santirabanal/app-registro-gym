export async function authenticate(req,res,next) {
 const url=process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
 if(!url || !key) {
  if(process.env.NODE_ENV==='production' || process.env.VERCEL) return res.status(503).json({error:'Falta configurar la autenticación'});
  return next(); // Desarrollo local previo a configurar Supabase Auth.
 }
 const authorization=req.header('authorization');
 if(!/^Bearer \S+$/.test(authorization || '')) return res.status(401).json({error:'Iniciá sesión para acceder a tus registros'});
 try {
  const response=await fetch(`${url.replace(/\/$/,'')}/auth/v1/user`,{headers:{apikey:key,Authorization:authorization},signal:AbortSignal.timeout(8000)});
  if(!response.ok) return res.status(response.status>=500?503:401).json({error:'No se pudo verificar la sesión'});
  const user=await response.json();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id || '')) return res.status(401).json({error:'Sesión inválida'});
  req.userId=user.id;
  next();
 }catch{return res.status(503).json({error:'No se pudo verificar la sesión. Reintentá.'});}
}
