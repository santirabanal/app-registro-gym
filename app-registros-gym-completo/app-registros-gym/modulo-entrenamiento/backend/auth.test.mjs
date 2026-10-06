import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authenticate} from './auth.js';
test('autenticación rechaza configuración ausente, tokens inválidos y usa el usuario verificado',async()=>{
 const original={...process.env};const oldFetch=globalThis.fetch;
 const req={header:()=>undefined,userId:'00000000-0000-0000-0000-000000000099'};
 let code,body,next=false;
 const res={status(c){code=c;return this;},json(j){body=j;return this;}};
 try {
  process.env.NODE_ENV='production';delete process.env.SUPABASE_URL;delete process.env.SUPABASE_PUBLISHABLE_KEY;delete process.env.SUPABASE_ANON_KEY;
  await authenticate(req,res,()=>next=true);assert.equal(code,503);assert.equal(next,false);
  process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='public-test';
  await authenticate(req,res,()=>next=true);assert.equal(code,401);
  req.header=()=> 'Bearer invalid';globalThis.fetch=async()=>new Response('{}',{status:401});
  await authenticate(req,res,()=>next=true);assert.equal(code,401);assert.equal(next,false);
  globalThis.fetch=async()=>new Response(JSON.stringify({id:'00000000-0000-0000-0000-000000000001'}));
  await authenticate(req,res,()=>next=true);assert.equal(next,true);assert.equal(req.userId,'00000000-0000-0000-0000-000000000001');
 }finally{
  globalThis.fetch=oldFetch;
  for(const k of ['NODE_ENV','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_ANON_KEY']) {if(original[k]===undefined)delete process.env[k];else process.env[k]=original[k];}
 }
});
