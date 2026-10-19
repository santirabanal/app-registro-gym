import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validDate,validateGoal,dailyIdeal,idealChange,classifyPace,paceSeries,exerciseSeries} from './goalMath.mjs';
const gain={baseline:70,target:75,rate:1,startDate:'2026-10-01'};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('ideal diario divide por los días reales del mes, incluido febrero bisiesto',()=>{
  near(dailyIdeal(1,'2026-10-01'),1/31);near(dailyIdeal(1,'2026-04-10'),1/30);
  near(dailyIdeal(1,'2026-02-02'),1/28);near(dailyIdeal(1,'2024-02-02'),1/29);
  near(dailyIdeal(-1,'2026-10-01'),-1/31);
});
test('sin margen: avance menor amarillo, igual verde y mayor rojo',()=>{
  const ideal=1/31;
  assert.equal(classifyPace(ideal,ideal),'ideal');assert.equal(classifyPace(.02,ideal),'below');assert.equal(classifyPace(.05,ideal),'above');
  assert.equal(classifyPace(-.02,-ideal),'below');assert.equal(classifyPace(-ideal,-ideal),'ideal');assert.equal(classifyPace(-.05,-ideal),'above');
});
test('cada barra usa el intervalo entre registros, no el acumulado desde el inicio',()=>{
  const rows=paceSeries([{date:'2026-10-01',value:70},{date:'2026-10-02',value:70+1/31},{date:'2026-10-04',value:70+1/31+.2}],gain);
  assert.equal(rows.length,2);near(rows[0].rate,1/31);assert.equal(rows[0].status,'ideal');
  near(rows[1].rate,.1);assert.equal(rows[1].days,2);assert.equal(rows[1].status,'above');
  assert.equal(rows[1].previousDate,'2026-10-02');
});
test('intervalos entre meses prorratean el ideal de cada día sin inventar mediciones',()=>{
  near(idealChange('2026-01-30','2026-02-02',1),1/31+2/28);
  const g={...gain,startDate:'2026-01-30'};
  const rows=paceSeries([{date:'2026-02-02',value:70+1/31+2/28}],g);
  assert.equal(rows.length,1);assert.equal(rows[0].days,3);near(rows[0].idealRate,(1/31+2/28)/3);assert.equal(rows[0].status,'ideal');
  near(idealChange('2024-02-28','2024-03-01',1),1/29+1/31);
});
test('filtros de mes conservan el registro previo y datos anteriores al objetivo se omiten',()=>{
  const rows=paceSeries([{date:'2026-09-29',value:99},{date:'2026-10-01',value:999},{date:'2026-10-31',value:71},{date:'2026-11-02',value:71.2}],gain);
  assert.equal(rows.length,2);near(rows[0].rate,1/30);near(rows[1].rate,.1);assert.equal(rows[1].days,2);
});
test('objetivos antiguos siguen siendo válidos pero el margen almacenado se ignora',()=>{
  assert.equal(validateGoal({...gain,tolerance:.2}),'');
  assert.deepEqual(paceSeries([{date:'2026-10-02',value:70.05}],gain),paceSeries([{date:'2026-10-02',value:70.05}],{...gain,tolerance:999}));
  for(const patch of [{rate:-1},{target:69},{baseline:NaN},{rate:0},{startDate:'x'}])assert.ok(validateGoal({...gain,...patch}));
  assert.equal(validDate('2026-02-31'),false);assert.equal(validDate('2026-99-99'),false);
});
test('kilaje usa el máximo diario del ejercicio seleccionado y acepta un inicio de cero',()=>{
  assert.deepEqual(exerciseSeries([{fecha:'2026-10-01',ejercicio_id:'a',sets:[{peso_kg:0}]},{fecha:'2026-10-02',ejercicio_id:'a',sets:[{peso_kg:20},{peso_kg:25}]},{fecha:'2026-10-02',ejercicio_id:'a',sets:[{peso_kg:30}]},{fecha:'2026-10-02',ejercicio_id:'b',sets:[{peso_kg:100}]}],'a'),[{date:'2026-10-01',value:0},{date:'2026-10-02',value:30}]);
  const g={...gain,kind:'exercise',baseline:0,target:10};near(paceSeries([{date:'2026-10-02',value:1}],g)[0].rate,1);
});
