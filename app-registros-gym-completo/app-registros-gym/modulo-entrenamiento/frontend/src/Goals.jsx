import {useState} from 'react';
import {BarChart,Bar,Cell,ReferenceArea,ReferenceLine,CartesianGrid,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts';
import {validateGoal,paceSeries,exerciseSeries,MONTHLY_MARGIN} from './goalMath.mjs';
import './goals.css';
const labels={below:'Por debajo del ritmo',ideal:'Dentro del ideal',above:'Por encima del ritmo'};
const colors={below:'#EFC65B',ideal:'#62C6A0',above:'#F08770'};
const fmt=value=>Number(value.toFixed(2)).toLocaleString('es-AR');
export function ChartType({value,onChange}) {
  return <label className="goal-chart-type">Gráfico<select value={value} onChange={e=>onChange(e.target.value)}><option value="line">Líneas</option><option value="bar">Barras</option><option value="goal">Ritmo objetivo</option></select></label>;
}
export function ValueBars({data,dataKey,label,theme}) {
  return <div style={{height:260}}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{left:-10,right:10,top:10}}><CartesianGrid stroke={theme.line} vertical={false}/><XAxis dataKey="fecha" tick={{fontSize:11,fill:theme.inkSoft}}/><YAxis tick={{fontSize:11,fill:theme.inkSoft}}/><Tooltip contentStyle={{background:theme.card,color:theme.ink,border:`1px solid ${theme.line}`,borderRadius:8}} cursor={{fill:theme.segment}}/><Bar dataKey={dataKey} name={label} fill={theme.accent} maxBarSize={30} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>;
}
export function GoalChart({records,goal,from,to,theme,onConfigure}) {
  if (!goal || validateGoal(goal,goal.kind==='exercise')) return <div className="goal-empty"><p>Definí un objetivo y tu ritmo ideal para ver este gráfico.</p><button className="btn-ghost" onClick={onConfigure}>Configurar objetivo</button></div>;
  const series=paceSeries(records,goal).filter(r=>r.date>=from && r.date<=to);
  const loss=goal.rate<0;
  const reached=series.length && (loss?series.at(-1).value<=goal.target:series.at(-1).value>=goal.target);
  const lower=goal.rate-MONTHLY_MARGIN,upper=goal.rate+MONTHLY_MARGIN;
  const extent=[0,lower,upper,...series.map(r=>r.rate)];
  const pad=Math.max(.1,(Math.max(...extent)-Math.min(...extent))*.1);
  const domain=[Math.min(...extent)-pad,Math.max(...extent)+pad];
  return <section className="goal-chart">
    <div className="goal-chart-summary"><strong>Meta: {fmt(goal.target)} kg</strong><span>Ideal: {goal.rate>0?'+':''}{fmt(goal.rate)} kg/mes</span></div>
    <p className="goal-note">La línea horizontal marca tu ritmo ideal en kg/mes. La franja verde admite ±0,2 kg/mes (400 g de ancho total). Cada barra muestra el ritmo equivalente entre dos registros.</p>
    {series.length ? <><div style={{height:280}}><ResponsiveContainer width="100%" height="100%"><BarChart data={series} margin={{left:0,right:12,top:12,bottom:8}}>
      <CartesianGrid stroke={theme.line} vertical={false}/><XAxis dataKey="date" tickFormatter={d=>d.slice(5).split('-').reverse().join('/')} tick={{fontSize:11,fill:theme.inkSoft}} minTickGap={24}/>
      <YAxis domain={domain} tick={{fontSize:11,fill:theme.inkSoft}} tickFormatter={fmt} width={54}/>
      <Tooltip cursor={{fill:theme.segment}} content={({active,payload})=>{if(!active||!payload?.length)return null;const r=payload[0].payload;return <div className="goal-tooltip" style={{background:theme.card,color:theme.ink,borderColor:theme.line}}><strong>{r.date.split('-').reverse().join('/')}</strong><p>{fmt(r.value)} kg · {r.days} {r.days===1?'día':'días'} desde {r.previousDate.split('-').reverse().join('/')}</p><p>Ritmo: {fmt(r.rate)} kg/mes</p><p>Ideal: {fmt(goal.rate)} kg/mes</p><p>Zona verde: {fmt(lower)} a {fmt(upper)} kg/mes</p><span style={{color:colors[r.status]}}>{labels[r.status]}</span></div>;}}/>
      <ReferenceArea y1={lower} y2={upper} fill={colors.ideal} fillOpacity={.15}/><ReferenceLine y={0} stroke={theme.inkSoft}/><ReferenceLine y={goal.rate} stroke={colors.ideal} strokeWidth={2} strokeDasharray="4 4" label={{value:`Ideal ${fmt(goal.rate)} kg/mes`,position:'insideTopRight',fill:theme.ink,fontSize:11}}/>
      <Bar dataKey="rate" name="Ritmo (kg/mes)" maxBarSize={28} radius={[2,2,0,0]}>{series.map(r=><Cell key={r.date} fill={colors[r.status]}/>)}</Bar>
    </BarChart></ResponsiveContainer></div><p className="goal-note">Último ritmo: <strong style={{color:colors[series.at(-1).status]}}>{fmt(series.at(-1).rate)} kg/mes · {labels[series.at(-1).status]}</strong>{reached?' · Peso objetivo alcanzado. Revisá tu próximo objetivo.':''}</p></>:<p className="goal-note">No hay mediciones posteriores al inicio del objetivo en este período. Elegí otro mes o registrá una nueva medición.</p>}
    <div className="goal-legend">{Object.entries(labels).map(([key,label])=><span key={key}><i style={{background:colors[key]}}/>{label}</span>)}</div>
    <p className="goal-note">Verde dentro de la franja, amarillo por debajo y rojo por encima del ritmo. Para bajar, perder más rápido que el límite es rojo. El cálculo contempla los días entre registros y la duración de cada mes; no se inventan mediciones.</p>
    <button className="btn-text" onClick={onConfigure}>Editar objetivo →</button>
  </section>;
}
function GoalForm({goal,records,title,exercise,selector,onSave,onDelete}) {
  const initial=records[0];
  const [draft,setDraft]=useState(()=>goal?{...goal}: {baseline:initial?.value??'',startDate:initial?.date??new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10),target:'',rate:''});
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  function field(key){return {value:draft[key],onChange:e=>{setDraft({...draft,[key]:e.target.value});setMessage('');}};}
  async function submit(e){e.preventDefault();const next={kind:exercise?'exercise':'weight',startDate:draft.startDate,...Object.fromEntries(['baseline','target','rate'].map(k=>[k,draft[k]===''?NaN:Number(draft[k])]))};const error=validateGoal(next,exercise);if(error){setMessage(error);return;}setBusy(true);try{await onSave(next);setMessage('Objetivo guardado.');}catch{setMessage('No se pudo guardar. Tu objetivo anterior se conserva; intentá nuevamente.');}finally{setBusy(false);}}
  async function remove(){setBusy(true);try{await onDelete();setDraft({...draft,target:'',rate:''});setMessage('Objetivo eliminado.');}catch{setMessage('No se pudo eliminar. Intentá nuevamente.');}finally{setBusy(false);}}
  return <form className="goal-form" onSubmit={submit}><h2>{title}</h2>{selector}<p className="goal-note">{exercise?'Se compara el mayor peso de una serie (top set) de cada día.':'Definí si querés subir o bajar de peso y a qué ritmo.'}</p><div className="goal-fields">
    <label>Peso objetivo (kg)<input type="number" required min={exercise?0:.01} step="any" {...field('target')}/></label>
    <label>Ritmo ideal (kg/mes)<input type="number" required step="any" placeholder={exercise?'Ej. 2.5':'Ej. 1 o -1'} {...field('rate')}/></label>
    <label>Fecha de inicio<input type="date" required {...field('startDate')}/></label>
    <label>Peso al inicio (kg)<input type="number" required min={exercise?0:.01} step="any" {...field('baseline')}/></label>
  </div><p className="goal-note">Ejemplo: para +1 kg/mes, la zona verde va de +0,8 a +1,2 kg/mes. Para bajar, usá un ritmo negativo. El punto inicial se precarga con el primer registro disponible; podés cambiarlo.</p><div className="goal-form-actions"><button className="btn-primary" disabled={busy}>{busy?'Guardando…':'Guardar objetivo'}</button>{goal&&<button type="button" className="btn-ghost" disabled={busy} onClick={remove}>Eliminar objetivo</button>}</div>{message&&<p role="status">{message}</p>}</form>;
}
export default function Goals({goals,onChange,ejercicios,registrosPeso,registrosEjercicio}) {
  const active=ejercicios.filter(e=>e.activo);
  const [selectedId,setSelectedId]=useState(active[0]?.id??'');
  const selected=active.find(e=>e.id===selectedId)??active[0];
  return <><p className="goal-note">Tus objetivos se guardan en tu cuenta. Definí el peso final y el ritmo mensual; el gráfico compara tu ritmo con una línea horizontal y una zona verde fija de ±0,2 kg/mes.</p><div className="gym-training-layout">
    <GoalForm key="weight" title="Peso corporal" goal={goals.weight} records={registrosPeso.map(r=>({date:r.fecha,value:r.peso_kg})).sort((a,b)=>a.date.localeCompare(b.date))} onSave={weight=>onChange({...goals,weight})} onDelete={()=>onChange({...goals,weight:null})}/>
    {selected ? <GoalForm key={selected.id} exercise title="Movimientos clave" selector={<label className="goal-movement-selector">Movimiento<select value={selected.id} onChange={e=>setSelectedId(e.target.value)}>{active.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>} goal={goals.exercises?.[selected.id]} records={exerciseSeries(registrosEjercicio,selected.id)} onSave={goal=>onChange({...goals,exercises:{...goals.exercises,[selected.id]:goal}})} onDelete={()=>{const next={...goals.exercises};delete next[selected.id];return onChange({...goals,exercises:next});}}/> : <p className="goal-note">Agregá un ejercicio en Hoy para definir su objetivo de kilaje.</p>}
  </div></>;
}
