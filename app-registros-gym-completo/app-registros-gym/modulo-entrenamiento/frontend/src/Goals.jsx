import {useState} from 'react';
import {BarChart,ComposedChart,Area,Line,Bar,Cell,CartesianGrid,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts';
import {validateGoal,trajectorySeries,exerciseSeries} from './goalMath.mjs';
import './goals.css';
const labels={below:'Avance por debajo del objetivo',ideal:'Dentro del objetivo',above:'Avance por encima del objetivo'};
const colors={below:'#EFC65B',ideal:'#62C6A0',above:'#F08770'};
const fmt=value=>Number(value.toFixed(2)).toLocaleString('es-AR');
export function ChartType({value,onChange}) {
  return <label className="goal-chart-type">Gráfico<select value={value} onChange={e=>onChange(e.target.value)}><option value="line">Líneas</option><option value="bar">Barras</option><option value="goal">Recorrido del objetivo</option></select></label>;
}
export function ValueBars({data,dataKey,label,theme}) {
  return <div style={{height:260}}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{left:-10,right:10,top:10}}><CartesianGrid stroke={theme.line} vertical={false}/><XAxis dataKey="fecha" tick={{fontSize:11,fill:theme.inkSoft}}/><YAxis tick={{fontSize:11,fill:theme.inkSoft}}/><Tooltip contentStyle={{background:theme.card,color:theme.ink,border:`1px solid ${theme.line}`,borderRadius:8}} cursor={{fill:theme.segment}}/><Bar dataKey={dataKey} name={label} fill={theme.accent} maxBarSize={30} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>;
}
export function GoalChart({records,goal,from,to,theme,onConfigure}) {
  if (!goal || validateGoal(goal,goal.kind==='exercise')) return <div className="goal-empty"><p>Definí un objetivo y tu ritmo ideal para ver este gráfico.</p><button className="btn-ghost" onClick={onConfigure}>Configurar objetivo</button></div>;
  const series=trajectorySeries(records,goal,from,to);
  const actual=series.filter(r=>r.value!==null);
  const latest=actual.at(-1);
  const reached=latest&&(goal.rate<0?latest.value<=goal.target:latest.value>=goal.target);
  const extent=series.length?series.flatMap(r=>[r.lower,r.upper,...(r.value===null?[]:[r.value])]):[goal.baseline];
  const pad=Math.max(.15,(Math.max(...extent)-Math.min(...extent))*.1);
  const domain=[Math.max(0,Math.min(...extent)-pad),Math.max(...extent)+pad];
  const dateLabel=date=>date.split('-').reverse().join('/');
  return <section className="goal-chart">
    <div className="goal-chart-summary"><strong>Meta: {fmt(goal.target)} kg</strong><span>Plan: {goal.rate>0?'+':''}{fmt(goal.rate)} kg/mes</span></div>
    <p className="goal-note">Peso real frente al esperado desde {dateLabel(goal.startDate)} ({fmt(goal.baseline)} kg). La línea ideal avanza cada día hasta la meta; la franja verde admite ±0,2 kg.</p>
    {series.length ? <><div style={{height:300}}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={series} margin={{left:0,right:12,top:12,bottom:8}}>
      <CartesianGrid stroke={theme.line} vertical={false}/><XAxis dataKey="date" tickFormatter={d=>d.slice(5).split('-').reverse().join('/')} tick={{fontSize:11,fill:theme.inkSoft}} minTickGap={24}/>
      <YAxis domain={domain} tick={{fontSize:11,fill:theme.inkSoft}} tickFormatter={fmt} width={54} label={{value:'kg',position:'insideTopLeft',fill:theme.inkSoft,fontSize:11}}/>
      <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const r=payload[0].payload;return <div className="goal-tooltip" style={{background:theme.card,color:theme.ink,borderColor:theme.line}}><strong>{dateLabel(r.date)}</strong><p>Esperado: {fmt(r.expected)} kg</p><p>Zona verde: {fmt(r.lower)} a {fmt(r.upper)} kg</p>{r.value===null?<p>Sin registro de peso en esta fecha.</p>:<><p>{r.initial?'Punto inicial configurado':'Peso registrado'}: {fmt(r.value)} kg</p><p>Diferencia: {r.value-r.expected>0?'+':''}{fmt(r.value-r.expected)} kg</p><span style={{color:colors[r.status]}}>{labels[r.status]}</span></>}</div>;}}/>
      <Area dataKey="band" name="Zona ideal (±0,2 kg)" type="linear" stroke="none" fill={colors.ideal} fillOpacity={.15} isAnimationActive={false}/>
      <Line dataKey="expected" name="Peso esperado (kg)" type="linear" stroke={colors.ideal} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false}/>
      <Bar dataKey="value" name="Peso registrado (kg)" maxBarSize={24} radius={[2,2,0,0]} isAnimationActive={false}>{series.map(r=><Cell key={r.date} fill={r.status?colors[r.status]:theme.accent}/>)}</Bar>
    </ComposedChart></ResponsiveContainer></div><div className="goal-legend"><span><i style={{background:colors.ideal}}/>Línea punteada: peso esperado</span><span><i style={{background:theme.inkSoft}}/>Barras: pesos registrados</span></div>{latest?<p className="goal-note">Último {latest.initial?'punto inicial':'registro'}: <strong style={{color:colors[latest.status]}}>{fmt(latest.value)} kg · {labels[latest.status]}</strong> · esperado {fmt(latest.expected)} kg{reached?' · Meta alcanzada.':''}</p>:<p className="goal-note">No hay registros en este período. Se muestra únicamente la trayectoria planificada.</p>}</>:<p className="goal-note">El período elegido es anterior al inicio del objetivo.</p>}
    <div className="goal-legend">{Object.entries(labels).map(([key,label])=><span key={key}><i style={{background:colors[key]}}/>{label}</span>)}</div>
    <p className="goal-note">Se compara cada peso con el plan de esa fecha, no con el registro anterior. Para bajar, perder más de lo previsto es rojo y menos es amarillo. Cada barra representa un registro disponible; los días sin mediciones quedan vacíos.</p>
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
  </div><p className="goal-note">Ejemplo: desde 75 kg, con +1 kg/mes, el peso esperado avanza hacia 76 kg al completar el mes. La zona verde es ±0,2 kg alrededor del peso esperado. Para bajar, usá un ritmo negativo. El punto inicial se precarga con el primer registro disponible; podés cambiarlo.</p><div className="goal-form-actions"><button className="btn-primary" disabled={busy}>{busy?'Guardando…':'Guardar objetivo'}</button>{goal&&<button type="button" className="btn-ghost" disabled={busy} onClick={remove}>Eliminar objetivo</button>}</div>{message&&<p role="status">{message}</p>}</form>;
}
export default function Goals({goals,onChange,ejercicios,registrosPeso,registrosEjercicio}) {
  const active=ejercicios.filter(e=>e.activo);
  const [selectedId,setSelectedId]=useState(active[0]?.id??'');
  const selected=active.find(e=>e.id===selectedId)??active[0];
  return <><p className="goal-note">Tus objetivos se guardan en tu cuenta. Definí el peso final y el ritmo mensual; el gráfico compara tu peso real con la trayectoria esperada desde el inicio, con una zona verde de ±0,2 kg.</p><div className="gym-training-layout">
    <GoalForm key="weight" title="Peso corporal" goal={goals.weight} records={registrosPeso.map(r=>({date:r.fecha,value:r.peso_kg})).sort((a,b)=>a.date.localeCompare(b.date))} onSave={weight=>onChange({...goals,weight})} onDelete={()=>onChange({...goals,weight:null})}/>
    {selected ? <GoalForm key={selected.id} exercise title="Movimientos clave" selector={<label className="goal-movement-selector">Movimiento<select value={selected.id} onChange={e=>setSelectedId(e.target.value)}>{active.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>} goal={goals.exercises?.[selected.id]} records={exerciseSeries(registrosEjercicio,selected.id)} onSave={goal=>onChange({...goals,exercises:{...goals.exercises,[selected.id]:goal}})} onDelete={()=>{const next={...goals.exercises};delete next[selected.id];return onChange({...goals,exercises:next});}}/> : <p className="goal-note">Agregá un ejercicio en Hoy para definir su objetivo de kilaje.</p>}
  </div></>;
}
