import {spawnSync} from 'node:child_process';
import {cp,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const frontend=fileURLToPath(new URL('../modulo-entrenamiento/frontend/',import.meta.url));
if(!process.env.npm_execpath) throw Error('Ejecutar con npm run build');
for(const args of [['ci','--include=dev','--no-audit','--no-fund'],['run','build']]) {
 const result=spawnSync(process.execPath,[process.env.npm_execpath,...args],{cwd:frontend,stdio:'inherit',windowsHide:true});
 if(result.status!==0) process.exit(result.status || 1);
}
const output=new URL('../dist/',import.meta.url);
await mkdir(output,{recursive:true});
await cp(new URL('../modulo-entrenamiento/frontend/dist/',import.meta.url),output,{recursive:true});
await cp(new URL('../comparador-precios/public/',import.meta.url),new URL('suplementos/',output),{recursive:true});
