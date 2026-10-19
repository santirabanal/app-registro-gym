const DAY = 86400000;
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const d=new Date(value+'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
}
export function validateGoal(goal, exercise=false) {
  if (!goal || !validDate(goal.startDate)) return 'Elegí una fecha de inicio válida.';
  if (![goal.baseline,goal.target,goal.rate,goal.tolerance].every(Number.isFinite)) return 'Completá todos los valores numéricos.';
  if (goal.baseline < 0 || goal.target < 0 || (!exercise && (goal.baseline === 0 || goal.target === 0))) return 'El peso debe ser positivo (en ejercicios puede ser 0).';
  if (goal.tolerance < 0) return 'El margen no puede ser negativo.';
  if (goal.rate === 0 || Math.sign(goal.target-goal.baseline) !== Math.sign(goal.rate)) return 'El ritmo debe apuntar hacia el peso objetivo: positivo para subir y negativo para bajar.';
  if (exercise && goal.rate < 0) return 'El objetivo de levantamiento debe ser de aumento.';
  return '';
}
// Calendar months anchored on the start date, clamping anniversaries such as Jan 31.
export function elapsedMonths(start, end) {
  if (!validDate(start) || !validDate(end) || end <= start) return 0;
  const a = new Date(start+'T00:00:00Z'), b = new Date(end+'T00:00:00Z');
  const anniversary = offset => {
    const d = new Date(Date.UTC(a.getUTCFullYear(),a.getUTCMonth()+offset,1));
    const last = new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
    d.setUTCDate(Math.min(a.getUTCDate(),last)); return d;
  };
  let whole = (b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth();
  if (anniversary(whole) > b) whole--;
  return whole + ((b-anniversary(whole))/DAY)/((anniversary(whole+1)-anniversary(whole))/DAY);
}
export function classifyPace(rate, goal) {
  const direction = Math.sign(goal.rate), progress = rate*direction, ideal = Math.abs(goal.rate);
  const epsilon = 1e-8;
  return progress < ideal-goal.tolerance-epsilon ? 'below' : progress > ideal+goal.tolerance+epsilon ? 'above' : 'ideal';
}
export function paceSeries(records, goal) {
  if (validateGoal(goal,goal?.kind==='exercise')) return [];
  const byDate = new Map();
  for (const r of records) if (validDate(r.date) && Number.isFinite(r.value)) byDate.set(r.date,r.value);
  return [...byDate].sort(([a],[b])=>a.localeCompare(b)).flatMap(([date,value])=>{
    const months=elapsedMonths(goal.startDate,date);
    if (!months) return [];
    const rate=(value-goal.baseline)/months;
    return [{date,value,rate,status:classifyPace(rate,goal)}];
  });
}
export function exerciseSeries(records, exerciseId) {
  const daily = new Map();
  for (const r of records) {
    if (r.ejercicio_id !== exerciseId || !validDate(r.fecha)) continue;
    const weights=(r.sets||[]).map(s=>Number(s.peso_kg)).filter(Number.isFinite);
    if (weights.length) daily.set(r.fecha,Math.max(daily.get(r.fecha)??-Infinity,...weights));
  }
  return [...daily].sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,value}));
}
