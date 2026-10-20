const DAY = 86400000;
export const TARGET_MARGIN = 0.2; // ±200 g around the expected weight.
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const d=new Date(value+'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
}
export function validateGoal(goal, exercise=false) {
  if (!goal || !validDate(goal.startDate)) return 'Elegí una fecha de inicio válida.';
  if (![goal.baseline,goal.target,goal.rate].every(Number.isFinite)) return 'Completá todos los valores numéricos.';
  if (goal.baseline < 0 || goal.target < 0 || (!exercise && (goal.baseline === 0 || goal.target === 0))) return 'El peso debe ser positivo (en ejercicios puede ser 0).';
  if (goal.rate === 0 || Math.sign(goal.target-goal.baseline) !== Math.sign(goal.rate)) return 'El ritmo debe apuntar hacia el peso objetivo: positivo para subir y negativo para bajar.';
  if (exercise && goal.rate < 0) return 'El objetivo de levantamiento debe ser de aumento.';
  return '';
}
export function dailyIdeal(monthlyRate,date) {
  const d=new Date(date+'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth()+1,0);
  return monthlyRate/d.getUTCDate();
}
// Integrate daily growth over [start,end), using each calendar month's length.
export function idealChange(start,end,monthlyRate) {
  if (!validDate(start)||!validDate(end)||end<=start) return 0;
  let cursor=new Date(start+'T00:00:00Z').getTime();
  const until=new Date(end+'T00:00:00Z').getTime();
  let result=0;
  while(cursor<until) {
    const d=new Date(cursor), next=new Date(cursor);
    next.setUTCMonth(next.getUTCMonth()+1,1);
    const stop=Math.min(until,next.getTime());
    result+=(stop-cursor)/DAY*dailyIdeal(monthlyRate,d.toISOString().slice(0,10));
    cursor=stop;
  }
  return result;
}
export function classifyPosition(actual,expected,direction) {
  const delta=(actual-expected)*Math.sign(direction);
  return Math.abs(delta)<=TARGET_MARGIN+1e-9?'ideal':delta<0?'below':'above';
}
export function trajectorySeries(records,goal,from,to) {
  if(validateGoal(goal,goal?.kind==='exercise')||!validDate(from)||!validDate(to))return [];
  const byDate=new Map();
  for(const r of records)if(validDate(r.date)&&Number.isFinite(r.value))byDate.set(r.date,r.value);
  const start=from>goal.startDate?from:goal.startDate;
  const end=new Date(to+'T00:00:00Z').getTime();
  const points=[];
  for(let time=new Date(start+'T00:00:00Z').getTime();time<=end;time+=DAY) {
    const date=new Date(time).toISOString().slice(0,10);
    const planned=goal.baseline+idealChange(goal.startDate,date,goal.rate);
    const expected=goal.rate>0?Math.min(planned,goal.target):Math.max(planned,goal.target);
    const initial=date===goal.startDate&&!byDate.has(date);
    const value=byDate.has(date)?byDate.get(date):initial?goal.baseline:null;
    const lower=Math.max(0,expected-TARGET_MARGIN),upper=expected+TARGET_MARGIN;
    points.push({date,value,expected,lower,upper,band:[lower,upper],initial,status:value===null?null:classifyPosition(value,expected,goal.rate)});
  }
  return points;
}
export function exerciseSeries(records, exerciseId) {
  const daily = new Map();
  for (const r of records) {
    if (r.ejercicio_id !== exerciseId || !validDate(r.fecha)) continue;
    const weights=(r.sets||[]).filter(s=>s.peso_kg!=null&&s.peso_kg!=='').map(s=>Number(s.peso_kg)).filter(n=>Number.isFinite(n)&&n>=0);
    if (weights.length) daily.set(r.fecha,Math.max(daily.get(r.fecha)??-Infinity,...weights));
  }
  return [...daily].sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,value}));
}
