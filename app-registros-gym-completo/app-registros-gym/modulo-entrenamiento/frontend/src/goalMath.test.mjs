import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validDate,validateGoal,dailyIdeal,splitAverage,averageSeries,trajectorySeries,exerciseSeries} from './goalMath.mjs';
const gain={kind:'weight',baseline:75,target:80,rate:1,startDate:'2026-11-01'};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('promedio diario acumulado: cambio total dividido por días, no último cambio',()=>{
  const rows=averageSeries([{date:'2026-11-11',value:75.4},{date:'2026-11-21',value:75.6}],gain,'2026-11-01','2026-11-30');
  near(rows[0].average,.04);near(rows[1].average,.03);assert.equal(rows[1].days,20);
  const only=averageSeries([{date:'2026-11-21',value:75.6}],gain,'2026-11-01','2026-11-30');
  near(rows[1].average,only[0].average);
});
test('el ideal permanece horizontal en el mes y usa sus días reales',()=>{
  near(dailyIdeal(1,'2026-11-30'),1/30);near(dailyIdeal(1,'2026-10-31'),1/31);
  near(dailyIdeal(1,'2024-02-29'),1/29);near(dailyIdeal(1,'2026-02-28'),1/28);
  const rows=averageSeries([{date:'2026-10-15',value:75.1},{date:'2026-11-15',value:75.2}],{...gain,startDate:'2026-10-01'},'2026-09-01','2026-11-30');
  assert.ok(rows.every(r=>r.ideal===1/30));
});
test('el margen mensual de ±200 g se convierte a diario y sus límites son verdes',()=>{
  const ideal=1/30,margin=.2/30;
  assert.equal(splitAverage(.8/30,ideal,margin).status,'ideal');assert.equal(splitAverage(1.2/30,ideal,margin).status,'ideal');
  assert.equal(splitAverage(.79/30,ideal,margin).status,'below');assert.equal(splitAverage(1.21/30,ideal,margin).status,'above');
});
test('barras segmentadas suman el promedio y solo colorean de rojo el exceso',()=>{
  const parts=splitAverage(.05,1/30,.2/30);
  near(parts.segmentBelow,.8/30);near(parts.segmentIdeal,.4/30);near(parts.segmentAbove,.05-1.2/30);
  near(parts.segmentBelow+parts.segmentIdeal+parts.segmentAbove,.05);
  assert.equal(parts.status,'above');
  const below=splitAverage(.01,1/30,.2/30);near(below.segmentBelow,.01);near(below.segmentIdeal,0);near(below.segmentAbove,0);
});
test('al bajar las partes son negativas y perder más rápido muestra exceso rojo',()=>{
  const parts=splitAverage(-.05,-1/30,.2/30);
  assert.equal(parts.status,'above');assert.ok(parts.segmentAbove<0);
  near(parts.segmentBelow+parts.segmentIdeal+parts.segmentAbove,-.05);
  assert.equal(splitAverage(-.01,-1/30,.2/30).status,'below');
  const opposite=splitAverage(.01,-1/30,.2/30);assert.equal(opposite.status,'below');near(opposite.segmentBelow,.01);
});
test('filtrar el mes no reinicia el promedio y no se fabrican pesos',()=>{
  const g={...gain,startDate:'2026-10-01'};
  const rows=averageSeries([{date:'2026-10-01',value:75},{date:'2026-10-02',value:75.1},{date:'2026-11-01',value:76}],g,'2026-11-01','2026-11-30');
  assert.equal(rows.length,1);assert.equal(rows[0].days,31);near(rows[0].average,1/31);
});
test('ejercicios usan top set y permiten un inicio de cero',()=>{
  assert.deepEqual(exerciseSeries([{fecha:'2026-11-02',ejercicio_id:'a',sets:[{peso_kg:2},{peso_kg:3}]},{fecha:'2026-11-02',ejercicio_id:'b',sets:[{peso_kg:100}]}],'a'),[{date:'2026-11-02',value:3}]);
  const rows=averageSeries([{date:'2026-11-02',value:1}],{...gain,kind:'exercise',baseline:0,target:10},'2026-11-01','2026-11-30');near(rows[0].average,1);
});
test('evita dividir por cero y acepta objetivos anteriores sin migrar datos',()=>{
  assert.equal(validateGoal({...gain,tolerance:999}),'');
  assert.deepEqual(averageSeries([{date:'2026-11-01',value:75}],gain,'2026-11-01','2026-11-30'),[]);
  assert.deepEqual(averageSeries([],gain,'x','2026-11-30'),[]);
  for(const patch of [{rate:-1},{target:74},{baseline:NaN},{rate:0},{startDate:'x'}])assert.ok(validateGoal({...gain,...patch}));
  assert.equal(validDate('2026-02-31'),false);assert.equal(validDate('2026-99-99'),false);
});

test('barras de objetivo comparan peso real con el esperado, sin alterar el promedio diario',()=>{
  const rows=trajectorySeries([{date:'2026-11-11',value:75.4}],gain,'2026-11-01','2026-11-30');
  const r=rows.find(r=>r.date==='2026-11-11');near(r.expected,75+10/30);assert.equal(r.value,75.4);assert.equal(r.status,'ideal');
  assert.equal(rows.filter(r=>r.value!==null).length,1);assert.equal(rows[0].value,null);
});
test('color completo usa límites de ±200 g y dirección correcta al bajar',()=>{
  const records=[{date:'2026-12-01',value:75.8},{date:'2026-12-02',value:76.7},{date:'2026-12-03',value:75.5}];
  const rows=trajectorySeries(records,gain,'2026-12-01','2026-12-31');
  near(rows[0].expected,76);assert.equal(rows[0].status,'ideal');assert.equal(rows[1].status,'above');assert.equal(rows[2].status,'below');
  const loss=trajectorySeries([{date:'2026-11-16',value:74.2}],{...gain,target:70,rate:-1},'2026-11-01','2026-11-30');
  assert.equal(loss.find(r=>r.date==='2026-11-16').status,'above');
});
test('trayectoria respeta fin de mes bisiesto, meta final y filtro sin reiniciarse',()=>{
  const g={...gain,baseline:75,target:76,startDate:'2024-02-01'};
  const rows=trajectorySeries([],g,'2024-03-01','2024-04-01');assert.ok(rows.every(r=>r.expected===76));
  const loss={...g,target:74,rate:-1};assert.ok(trajectorySeries([],loss,'2024-03-01','2024-04-01').every(r=>r.expected===74));
  assert.deepEqual(trajectorySeries([],gain,'2026-10-01','2026-10-31'),[]);
});
