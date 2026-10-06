import {useEffect,useState} from 'react';
import {supabase} from './supabase.js';
import Dashboard from './Dashboard.jsx';
import './auth.css';
export default function AuthGate() {
 const [session,setSession]=useState(null),[loading,setLoading]=useState(!!supabase);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  if(!supabase)return;
  let live=true;
  const callback=new URLSearchParams(window.location.hash.slice(1));
  if(callback.has('error') || new URLSearchParams(window.location.search).has('error'))setMessage('No se pudo completar el acceso con Google. Intentá nuevamente.');
  supabase.auth.getSession().then(({data,error})=>{if(live){setSession(data.session);setLoading(false);if(error)setMessage('No se pudo recuperar la sesión.');}}).catch(()=>{if(live){setLoading(false);setMessage('No se pudo recuperar la sesión. Intentá nuevamente.');}});
  const {data}=supabase.auth.onAuthStateChange((_event,next)=>{if(live){setSession(next);setLoading(false);}});
  return ()=>{live=false;data.subscription.unsubscribe();};
 },[]);
 if(!supabase) return import.meta.env.DEV ? <Dashboard/> : <main className="gym-auth"><h1>Mi Gym</h1><p>Falta configurar Supabase Auth para habilitar la aplicación.</p></main>;
 if(loading)return <main className="gym-auth">Cargando sesión…</main>;
 if(session)return <Dashboard key={session.user.id} userId={session.user.id} onSignOut={()=>supabase.auth.signOut()}/>;
 async function submit(e) {
  e.preventDefault();setBusy(true);setMessage('');
  try {
   const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});
   if(error){setMessage('No se pudo iniciar el acceso con Google. Intentá nuevamente.');setBusy(false);}
  }catch{setMessage('No se pudo conectar. Intentá nuevamente.');setBusy(false);}
 }
 return <main className="gym-auth"><form onSubmit={submit}><h1>Mi Gym</h1><p>Ingresá con Google para guardar tu progreso.</p><button disabled={busy}>{busy?'Conectando…':'Continuar con Google'}</button>{message && <p role="status">{message}</p>}</form></main>;
}
