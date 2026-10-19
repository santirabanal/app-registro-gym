import {useState} from 'react';
import {BarChart,Bar,Cell,ReferenceArea,ReferenceLine,CartesianGrid,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts';
import {validateGoal,paceSeries,exerciseSeries} from './goalMath.mjs';
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
  const limits=[goal.rate-goal.tolerance,goal.rate+goal.tolerance];
  const extents=[0,...limits,...series.map(r=>r.rate)];
  const pad=Math.max(.1,(Math.max(...extents)-Math.min(...extents))*.12);
  const min=Math.min(...extents)-pad,max=Math.max(...extents)+pad;
  const loss=goal.rate<0;
  const reached=series.length && (loss?series.at(-1).value<=goal.target:series.at(-1).value>=goal.target);
  return <section className="goal-chart">
    <div className="goal-chart-summary"><strong>Meta: {fmt(goal.target)} kg</strong><span>Ideal: {goal.rate>0?'+':''}{fmt(goal.rate)} ± {fmt(goal.tolerance)} kg/mes</span></div>
    <p className="goal-note">Ritmo mensual equivalente desde {goal.startDate.split('-').reverse().join('/')} ({fmt(goal.baseline)} kg). Cada barra compara el avance acumulado con tu criterio.</p>
    {series.length ? <><div style={{height:280}}><ResponsiveContainer width="100%" height="100%"><BarChart data={series} margin={{left:0,right:12,top:12,bottom:8}}>
      <ReferenceArea y1={min} y2={limits[0]} fill={loss?colors.above:colors.below} fillOpacity={.10}/>
      <ReferenceArea y1={limits[0]} y2={limits[1]} fill={colors.ideal} fillOpacity={.13}/>
      <ReferenceArea y1={limits[1]} y2={max} fill={loss?colors.below:colors.above} fillOpacity={.10}/>
      <CartesianGrid stroke={theme.line} vertical={false}/><XAxis dataKey="date" tickFormatter={d=>d.slice(5).split('-').reverse().join('/')} tick={{fontSize:11,fill:theme.inkSoft}} minTickGap={24}/>
      <YAxis domain={[min,max]} tick={{fontSize:11,fill:theme.inkSoft}} tickFormatter={fmt} width={48}/>
      <Tooltip cursor={{fill:theme.segment}} content={({active,payload})=>{if(!active||!payload?.length)return null;const r=payload[0].payload;return <div className="goal-tooltip" style={{background:theme.card,color:theme.ink,borderColor:theme.line}}><strong>{r.date.split('-').reverse().join('/')}</strong><p>{fmt(r.value)} kg · {fmt(r.rate)} kg/mes</p><span style={{color:colors[r.status]}}>{labels[r.status]}</span></div>;}}/>
      <ReferenceLine y={0} stroke={theme.inkSoft}/><ReferenceLine y={goal.rate} stroke={colors.ideal} strokeDasharray="4 4"/>
      <Bar dataKey="rate" name="Ritmo (kg/mes)" maxBarSize={28} radius={[2,2,0,0]}>{series.map(r=><Cell key={r.date} fill={colors[r.status]}/>)}</Bar>
    </BarChart></ResponsiveContainer></div><p className="goal-note">Último ritmo: <strong style={{color:colors[series.at(-1).status]}}>{fmt(series.at(-1).rate)} kg/mes · {labels[series.at(-1).status]}</strong>{reached?' · Peso objetivo alcanzado. Revisá tu próximo objetivo.':''}</p></>:<p className="goal-note">No hay mediciones posteriores al inicio del objetivo en este período. Elegí otro mes o registrá una nueva medición.</p>}
    <div className="goal-legend">{Object.entries(labels).map(([key,label])=><span key={key}><i style={{background:colors[key]}}/>{label}</span>)}</div>
    <p className="goal-note">Los colores evalúan el ritmo que elegiste. En una bajada, perder más rápido de lo ideal es rojo y más lento es amarillo.</p>
    <button className="btn-text" onClick={onConfigure}>Editar objetivo →</button>
  </section>;
}
function GoalForm({goal,records,title,exercise,onSave,onDelete}) {
  const initial=records[0];
  const [draft,setDraft]=useState(()=>goal?{...goal}: {baseline:initial?.value??'',startDate:initial?.date??new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10),target:'',rate:'',tolerance:''});
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  function field(key){return {value:draft[key],onChange:e=>{setDraft({...draft,[key]:e.target.value});setMessage('');}};}
  async function submit(e){e.preventDefault();const next={kind:exercise?'exercise':'weight',startDate:draft.startDate,...Object.fromEntries(['baseline','target','rate','tolerance'].map(k=>[k,draft[k]===''?NaN:Number(draft[k])]))};const error=validateGoal(next,exercise);if(error){setMessage(error);return;}setBusy(true);try{await onSave(next);setMessage('Objetivo guardado.');}catch{setMessage('No se pudo guardar. Tu objetivo anterior se conserva; intentá nuevamente.');}finally{setBusy(false);}}
  async function remove(){setBusy(true);try{await onDelete();setDraft({...draft,target:'',rate:'',tolerance:''});setMessage('Objetivo eliminado.');}catch{setMessage('No se pudo eliminar. Intentá nuevamente.');}finally{setBusy(false);}}
  return <form className="goal-form" onSubmit={submit}><h2>{title}</h2><p className="goal-note">{exercise?'Se compara el mayor peso de una serie (top set) de cada día.':'Definí si querés subir o bajar de peso y a qué ritmo.'}</p><div className="goal-fields">
    <label>Peso objetivo (kg)<input type="number" required min={exercise?0:.01} step="any" {...field('target')}/></label>
    <label>Ritmo ideal (kg/mes)<input type="number" required step="any" placeholder={exercise?'Ej. 2.5':'Ej. 1 o -1'} {...field('rate')}/></label>
    <label>Margen ideal ± (kg/mes)<input type="number" required min="0" step="any" placeholder="Ej. 0.2" {...field('tolerance')}/></label>
    <label>Fecha de inicio<input type="date" required {...field('startDate')}/></label>
    <label>Peso al inicio (kg)<input type="number" required min={exercise?0:.01} step="any" {...field('baseline')}/></label>
  </div><p className="goal-note">Ejemplo: +1 kg/mes con margen ±0,2 → verde entre +0,8 y +1,2. Para bajar, usá un ritmo negativo. El punto inicial se precarga con el primer registro disponible; podés cambiarlo.</p><div className="goal-form-actions"><button className="btn-primary" disabled={busy}>{busy?'Guardando…':'Guardar objetivo'}</button>{goal&&<button type="button" className="btn-ghost" disabled={busy} onClick={remove}>Eliminar objetivo</button>}</div>{message&&<p role="status">{message}</p>}</form>;
}
export default function Goals({goals,onChange,ejercicios,registrosPeso,registrosEjercicio}) {
  const active=ejercicios.filter(e=>e.activo);
  return <><p className="goal-note">Tus objetivos se guardan en tu cuenta. El peso final y el ritmo mensual se configuran por separado; el margen define la zona verde.</p><div className="gym-training-layout">
    <GoalForm key="weight" title="Peso corporal" goal={goals.weight} records={registrosPeso.map(r=>({date:r.fecha,value:r.peso_kg})).sort((a,b)=>a.date.localeCompare(b.date))} onSave={weight=>onChange({...goals,weight})} onDelete={()=>onChange({...goals,weight:null})}/>
    {active.map(e=><GoalForm key={e.id} exercise title={e.nombre} goal={goals.exercises?.[e.id]} records={exerciseSeries(registrosEjercicio,e.id)} onSave={goal=>onChange({...goals,exercises:{...goals.exercises,[e.id]:goal}})} onDelete={()=>{const next={...goals.exercises};delete next[e.id];return onChange({...goals,exercises:next});}}/>)}
    {!active.length&&<p className="goal-note">Agregá un ejercicio en Hoy para definir su objetivo de kilaje.</p>}
  </div></>;
}
