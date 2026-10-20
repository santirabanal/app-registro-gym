import {useState} from 'react';
import {BarChart,ReferenceArea,ReferenceLine,Bar,CartesianGrid,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts';
import {validateGoal,averageSeries,exerciseSeries,dailyIdeal,TARGET_MARGIN} from './goalMath.mjs';
import './goals.css';
const labels={below:'Avance por debajo del objetivo',ideal:'Dentro del objetivo',above:'Avance por encima del objetivo'};
const colors={below:'#EFC65B',ideal:'#62C6A0',above:'#F08770'};
const fmt=value=>Number(value.toFixed(2)).toLocaleString('es-AR');
export function ChartType({value,onChange}) {
  return <label className="goal-chart-type">Gráfico<select value={value} onChange={e=>onChange(e.target.value)}><option value="line">Líneas</option><option value="bar">Barras</option><option value="goal">Promedio diario</option></select></label>;
}
export function ValueBars({data,dataKey,label,theme}) {
  return <div style={{height:260}}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{left:-10,right:10,top:10}}><CartesianGrid stroke={theme.line} vertical={false}/><XAxis dataKey="fecha" tick={{fontSize:11,fill:theme.inkSoft}}/><YAxis tick={{fontSize:11,fill:theme.inkSoft}}/><Tooltip contentStyle={{background:theme.card,color:theme.ink,border:`1px solid ${theme.line}`,borderRadius:8}} cursor={{fill:theme.segment}}/><Bar dataKey={dataKey} name={label} fill={theme.accent} maxBarSize={30} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>;
}
export function GoalChart({records,goal,from,to,theme,onConfigure}) {
  if (!goal || validateGoal(goal,goal.kind==='exercise')) return <div className="goal-empty"><p>Definí un objetivo y tu ritmo ideal para ver este gráfico.</p><button className="btn-ghost" onClick={onConfigure}>Configurar objetivo</button></div>;
  const series=averageSeries(records,goal,from,to).map(r=>({...r,average:r.average*1000,ideal:r.ideal*1000,segmentBelow:r.segmentBelow*1000,segmentIdeal:r.segmentIdeal*1000,segmentAbove:r.segmentAbove*1000}));
  const ideal=dailyIdeal(goal.rate,to)*1000,margin=dailyIdeal(TARGET_MARGIN,to)*1000;
  const lower=ideal-margin,upper=ideal+margin;
  const latest=series.at(-1);
  const extent=[0,lower,upper,...series.map(r=>r.average)];
  const pad=Math.max(1,(Math.max(...extent)-Math.min(...extent))*.1);
  const domain=[Math.min(...extent)-pad,Math.max(...extent)+pad];
  const dateLabel=date=>date.split('-').reverse().join('/');
  const tickDate=time=>new Date(time).toISOString().slice(5,10).split('-').reverse().join('/');
  return <section className="goal-chart">
    <div className="goal-chart-summary"><strong>Meta: {fmt(goal.target)} kg</strong><span>Ideal diario: {fmt(ideal)} g/día</span></div>
    <p className="goal-note">Cada barra muestra tu promedio desde {dateLabel(goal.startDate)}: (peso registrado − {fmt(goal.baseline)} kg) ÷ días transcurridos. No es el cambio de un solo día.</p>
    {series.length ? <><div style={{height:300}}><ResponsiveContainer width="100%" height="100%"><BarChart data={series} stackOffset="sign" margin={{left:0,right:16,top:24,bottom:8}}>
      <CartesianGrid stroke={theme.line} vertical={false}/><XAxis dataKey="time" type="number" scale="time" domain={[new Date(from+'T00:00:00Z').getTime(),new Date(to+'T00:00:00Z').getTime()]} tickFormatter={tickDate} tick={{fontSize:11,fill:theme.inkSoft}} minTickGap={24}/>
      <YAxis domain={domain} tick={{fontSize:11,fill:theme.inkSoft}} tickFormatter={fmt} width={58} label={{value:'g/día',position:'insideTopLeft',fill:theme.inkSoft,fontSize:11}}/>
      <Tooltip cursor={{fill:theme.segment}} content={({active,payload})=>{if(!active||!payload?.length)return null;const r=payload[0].payload;return <div className="goal-tooltip" style={{background:theme.card,color:theme.ink,borderColor:theme.line}}><strong>{dateLabel(r.date)}</strong><p>Peso registrado: {fmt(r.value)} kg</p><p>Cambio total: {r.change>0?'+':''}{fmt(r.change)} kg en {r.days} días</p><p>Promedio: {fmt(r.average)} g/día</p><p>Ideal: {fmt(ideal)} g/día · rango {fmt(lower)} a {fmt(upper)}</p><span style={{color:colors[r.status]}}>{labels[r.status]}</span></div>;}}/>
      <ReferenceArea y1={lower} y2={upper} fill={colors.ideal} fillOpacity={.08}/>
      <Bar dataKey="segmentBelow" name="Hasta el rango ideal" stackId="average" fill={colors.below} maxBarSize={26} isAnimationActive={false}/>
      <Bar dataKey="segmentIdeal" name="Dentro del rango" stackId="average" fill={colors.ideal} maxBarSize={26} isAnimationActive={false}/>
      <Bar dataKey="segmentAbove" name="Exceso sobre el rango" stackId="average" fill={colors.above} maxBarSize={26} isAnimationActive={false}/>
      <ReferenceLine y={0} stroke={theme.inkSoft}/><ReferenceLine y={ideal} stroke={theme.ink} strokeWidth={2} strokeDasharray="5 4" label={{value:`Ideal ${fmt(ideal)} g/día`,position:'insideTopRight',fill:theme.ink,fontSize:11}}/>
    </BarChart></ResponsiveContainer></div><p className="goal-note">Último promedio: <strong style={{color:colors[latest.status]}}>{fmt(latest.average)} g/día · {labels[latest.status]}</strong></p></>:<p className="goal-note">Necesitás un registro posterior a la fecha inicial en este período para calcular el promedio.</p>}
    <div className="goal-legend"><span><i style={{background:colors.below}}/>Tramo hasta el rango ideal</span><span><i style={{background:colors.ideal}}/>Tramo dentro del rango</span><span><i style={{background:colors.above}}/>Solo el exceso</span></div>
    <p className="goal-note">La altura total es el promedio. El amarillo llega hasta el rango, el verde cubre la parte dentro de él y solo el exceso es rojo. La línea usa {fmt(goal.rate)} kg/mes dividido por los días de {to.slice(0,7)}, con margen equivalente a ±0,2 kg/mes. Los días sin peso no generan barras; sí cuentan en el tiempo transcurrido. En una bajada, las barras y la referencia son negativas.</p>
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
  </div><p className="goal-note">Ejemplo: +1 kg/mes en un mes de 30 días fija el ideal en 33,33 g/día y el rango en 26,67 a 40 g/día. Para bajar, usá un ritmo negativo. El punto inicial se precarga con el primer registro disponible; podés cambiarlo.</p><div className="goal-form-actions"><button className="btn-primary" disabled={busy}>{busy?'Guardando…':'Guardar objetivo'}</button>{goal&&<button type="button" className="btn-ghost" disabled={busy} onClick={remove}>Eliminar objetivo</button>}</div>{message&&<p role="status">{message}</p>}</form>;
}
export default function Goals({goals,onChange,ejercicios,registrosPeso,registrosEjercicio}) {
  const active=ejercicios.filter(e=>e.activo);
  const [selectedId,setSelectedId]=useState(active[0]?.id??'');
  const selected=active.find(e=>e.id===selectedId)??active[0];
  return <><p className="goal-note">Tus objetivos se guardan en tu cuenta. Definí el peso final y el ritmo mensual; el gráfico compara tu promedio diario acumulado con el ritmo ideal mensual convertido a g/día.</p><div className="gym-training-layout">
    <GoalForm key="weight" title="Peso corporal" goal={goals.weight} records={registrosPeso.map(r=>({date:r.fecha,value:r.peso_kg})).sort((a,b)=>a.date.localeCompare(b.date))} onSave={weight=>onChange({...goals,weight})} onDelete={()=>onChange({...goals,weight:null})}/>
    {selected ? <GoalForm key={selected.id} exercise title="Movimientos clave" selector={<label className="goal-movement-selector">Movimiento<select value={selected.id} onChange={e=>setSelectedId(e.target.value)}>{active.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>} goal={goals.exercises?.[selected.id]} records={exerciseSeries(registrosEjercicio,selected.id)} onSave={goal=>onChange({...goals,exercises:{...goals.exercises,[selected.id]:goal}})} onDelete={()=>{const next={...goals.exercises};delete next[selected.id];return onChange({...goals,exercises:next});}}/> : <p className="goal-note">Agregá un ejercicio en Hoy para definir su objetivo de kilaje.</p>}
  </div></>;
}
