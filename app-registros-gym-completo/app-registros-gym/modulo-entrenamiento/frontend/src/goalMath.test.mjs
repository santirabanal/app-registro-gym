import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validDate,validateGoal,dailyIdeal,idealChange,classifyPosition,trajectorySeries,exerciseSeries} from './goalMath.mjs';
const gain={kind:'weight',baseline:75,target:80,rate:1,startDate:'2026-11-01'};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const point=(rows,date)=>rows.find(r=>r.date===date);
test('peso esperado: 75,333 al día 10, 75,667 al día 20 y 76 al completar noviembre',()=>{
  const rows=trajectorySeries([],gain,'2026-11-01','2026-12-01');
  near(point(rows,'2026-11-11').expected,75+10/30);
  near(point(rows,'2026-11-21').expected,75+20/30);
  near(point(rows,'2026-12-01').expected,76);
  near(rows[0].expected,75);assert.equal(rows[0].initial,true);
});
test('franja fija de 400 g alrededor del peso esperado, límites incluidos',()=>{
  for(const value of [75.8,76,76.2])assert.equal(classifyPosition(value,76,1),'ideal');
  assert.equal(classifyPosition(75.79,76,1),'below');assert.equal(classifyPosition(76.21,76,1),'above');
  assert.equal(classifyPosition(75.79,76,-1),'above');assert.equal(classifyPosition(76.21,76,-1),'below');
  const row=point(trajectorySeries([],gain,'2026-11-11','2026-11-11'),'2026-11-11');
  near(row.upper-row.lower,.4);near(row.expected-row.lower,.2);
});
test('cada registro se compara con el recorrido original, no con la medición anterior',()=>{
  const last={date:'2026-11-21',value:75.7};
  const one=point(trajectorySeries([last],gain,'2026-11-01','2026-11-30'),last.date);
  const two=point(trajectorySeries([{date:'2026-11-15',value:79},last],gain,'2026-11-01','2026-11-30'),last.date);
  near(one.expected,two.expected);assert.equal(one.status,'ideal');assert.equal(two.status,'ideal');
  assert.equal(one.value,75.7);
});
test('filtrar el mes no reinicia el objetivo y no se inventan pesos entre registros',()=>{
  const rows=trajectorySeries([{date:'2026-12-10',value:76.3}],gain,'2026-12-01','2026-12-31');
  near(rows[0].expected,76);assert.equal(rows[0].value,null);
  assert.equal(rows.filter(r=>r.value!==null).length,1);assert.equal(rows.length,31);
  assert.equal(point(rows,'2026-12-10').value,76.3);
});
test('la trayectoria se detiene en la meta tanto al subir como al bajar',()=>{
  const upper=trajectorySeries([],{...gain,target:76},'2026-12-01','2027-01-01');
  assert.ok(upper.every(r=>r.expected===76));
  const loss={...gain,target:74,rate:-1};
  const lower=trajectorySeries([],loss,'2026-12-01','2027-01-01');
  assert.ok(lower.every(r=>r.expected===74));
  const rows=trajectorySeries([{date:'2026-11-16',value:74.2}],loss,'2026-11-01','2026-11-30');
  assert.equal(point(rows,'2026-11-16').status,'above');
});
test('el plan respeta meses reales, cruces de mes y febrero bisiesto',()=>{
  near(dailyIdeal(1,'2026-02-02'),1/28);near(dailyIdeal(1,'2024-02-02'),1/29);
  near(idealChange('2026-01-30','2026-02-02',1),2/31+1/28);
  near(idealChange('2024-02-01','2024-03-01',1),1);
  near(idealChange('2026-02-01','2026-03-01',1),1);
});
test('ejercicios usan top set y admiten un punto inicial de cero',()=>{
  const records=[{fecha:'2026-11-02',ejercicio_id:'a',sets:[{peso_kg:1},{peso_kg:2}]},{fecha:'2026-11-02',ejercicio_id:'a',sets:[{peso_kg:3}]},{fecha:'2026-11-02',ejercicio_id:'b',sets:[{peso_kg:100}]}];
  assert.deepEqual(exerciseSeries(records,'a'),[{date:'2026-11-02',value:3}]);
  const g={...gain,kind:'exercise',baseline:0,target:10};
  near(point(trajectorySeries([],g,'2026-11-02','2026-11-02'),'2026-11-02').expected,1/30);
});
test('objetivos antiguos son compatibles y períodos anteriores o fechas inválidas no producen recorrido',()=>{
  assert.equal(validateGoal({...gain,tolerance:999}),'');
  assert.deepEqual(trajectorySeries([],gain,'2026-10-01','2026-10-31'),[]);
  assert.deepEqual(trajectorySeries([],gain,'x','2026-11-01'),[]);
  for(const patch of [{rate:-1},{target:74},{baseline:NaN},{rate:0},{startDate:'x'}])assert.ok(validateGoal({...gain,...patch}));
  assert.equal(validDate('2026-02-31'),false);assert.equal(validDate('2026-99-99'),false);
});
