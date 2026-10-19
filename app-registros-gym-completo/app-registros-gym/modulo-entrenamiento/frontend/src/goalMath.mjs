const DAY = 86400000;
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
// Sum the daily reference over (start,end], including each month's actual length.
export function idealChange(start,end,monthlyRate) {
  if (!validDate(start)||!validDate(end)||end<=start) return 0;
  let cursor=new Date(start+'T00:00:00Z').getTime()+DAY;
  const until=new Date(end+'T00:00:00Z').getTime()+DAY;
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
export function classifyPace(actual,ideal) {
  const direction=Math.sign(ideal);
  const delta=(actual-ideal)*direction;
  // Only floating-point noise is ignored; there is no ideal margin.
  return Math.abs(delta)<1e-9?'ideal':delta<0?'below':'above';
}
export function paceSeries(records, goal) {
  if (validateGoal(goal,goal?.kind==='exercise')) return [];
  const byDate = new Map();
  for (const r of records) if (validDate(r.date) && Number.isFinite(r.value)) byDate.set(r.date,r.value);
  let previous={date:goal.startDate,value:goal.baseline};
  const points=[];
  for(const [date,value] of [...byDate].sort(([a],[b])=>a.localeCompare(b))) {
    if(date<=goal.startDate)continue;
    const days=(new Date(date+'T00:00:00Z')-new Date(previous.date+'T00:00:00Z'))/DAY;
    const rate=(value-previous.value)/days;
    const idealRate=idealChange(previous.date,date,goal.rate)/days;
    if(Number.isFinite(rate))points.push({date,value,rate,idealRate,days,previousDate:previous.date,status:classifyPace(rate,idealRate)});
    previous={date,value};
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
