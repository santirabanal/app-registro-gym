import {useState, useEffect, useRef} from 'react';
import {storage} from './storageApi.js';
import App from './App.jsx';
import './dashboard.css';

export default function Dashboard({userId='local',onSignOut}) {
 const themeKey=`gym:theme:${userId}`;
 const [section,setSection]=useState('inicio');
 const [visited,setVisited]=useState({});
 const [dark,setDark]=useState(()=>{try{return localStorage.getItem(themeKey) !== 'light';}catch{return true;}});
 const [themeError,setThemeError]=useState('');
 const touched=useRef(false);
 const comparator=useRef(null);
 useEffect(()=>{
  storage.get('tema-oscuro').then(r=>{
   if(r && !touched.current) setDark(!!JSON.parse(r.value));
  }).catch(()=>{});
 },[]);
 function syncComparator() {
  if(comparator.current?.contentDocument) comparator.current.contentDocument.documentElement.dataset.theme=dark?'dark':'light';
 }
 useEffect(()=>{
  try {localStorage.setItem(themeKey,dark?'dark':'light');}catch{}
  syncComparator();
 },[dark]);
 async function toggleTheme() {
  touched.current=true;
  const next=!dark;
  setDark(next);setThemeError('');
  try {await storage.set('tema-oscuro',JSON.stringify(next));}catch{setThemeError('El tema se aplicó aquí, pero no se pudo sincronizar con la base de datos.');}
 }
 function open(next) {setSection(next);setVisited(v=>({...v,[next]:true}));}
 return <div className="gym-shell" data-theme={dark?'dark':'light'}>
  <nav className="gym-nav" aria-label="Navegación principal">
   <button className="gym-brand" onClick={()=>open('inicio')}>Mi Gym</button>
   <div>{[['inicio','Inicio'],['entrenamiento','Entrenamiento'],['suplementos','Suplementos']].map(([id,label])=><button key={id} aria-current={section===id?'page':undefined} onClick={()=>open(id)}>{label}</button>)}{onSignOut && <button onClick={onSignOut}>Salir</button>}</div>
  </nav>
  {section==='inicio' && <div className="gym-home-surface"><main className="gym-home">
   <button className="gym-theme-corner" role="switch" aria-checked={dark} aria-label="Tema oscuro" onClick={toggleTheme}><span className="gym-toggle-track"><span/></span></button>
   <p className="gym-eyebrow">TU ESPACIO PERSONAL</p>
   <h1>Tu progreso, en un solo lugar.</h1>
   <p className="gym-intro">Registrá tu entrenamiento y encontrá suplementos al mejor precio.</p>
   {themeError && <p role="status">{themeError}</p>}
   <div className="gym-modules">
    <button onClick={()=>open('entrenamiento')}><span className="gym-icon">↗</span><h2>Entrenamiento</h2><p>Peso corporal, ejercicios y gráficos para seguir tu evolución.</p><span className="gym-action">Ver mis registros →</span></button>
    <button onClick={()=>open('suplementos')}><span className="gym-icon">⌕</span><h2>Suplementos</h2><p>Compará precios, revisá ofertas y guardá tus favoritos.</p><span className="gym-action">Comparar precios →</span></button>
   </div>
  </main></div>}
  {visited.entrenamiento && <div hidden={section!=='entrenamiento'}><App dark={dark}/></div>}
  {visited.suplementos && <div hidden={section!=='suplementos'}><iframe ref={comparator} onLoad={syncComparator} className="gym-comparator" title="Comparador de suplementos" src={`/suplementos/?user=${encodeURIComponent(userId)}`}/></div>}
 </div>;
}
