import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validDate,validateGoal,elapsedMonths,classifyPace,paceSeries,exerciseSeries} from './goalMath.mjs';
const gain={baseline:70,target:75,rate:1,tolerance:.2,startDate:'2026-01-01'};
test('los límites ideales son inclusivos y el margen se aplica al ritmo elegido',()=>{
  for(const rate of [.8,1,1.2])assert.equal(classifyPace(rate,gain),'ideal');
  assert.equal(classifyPace(.79,gain),'below');assert.equal(classifyPace(1.21,gain),'above');
  assert.equal(classifyPace(-1,gain),'below');
});
test('al bajar, perder demasiado es rojo y perder poco es amarillo',()=>{
  const loss={...gain,target:65,rate:-1};
  assert.equal(classifyPace(-1.3,loss),'above');assert.equal(classifyPace(-.7,loss),'below');
  assert.equal(classifyPace(-1,loss),'ideal');assert.equal(classifyPace(.5,loss),'below');
});
test('calendario usa meses reales, fin de mes y años bisiestos',()=>{
  assert.equal(elapsedMonths('2026-01-01','2026-02-01'),1);
  assert.equal(elapsedMonths('2024-01-31','2024-02-29'),1);
  assert.equal(elapsedMonths('2024-01-31','2024-03-31'),2);
  assert.equal(elapsedMonths('2026-01-01','2026-01-01'),0);
  assert.equal(validDate('2026-02-31'),false);assert.equal(validDate('2026-99-99'),false);
});
test('ritmo se ancla al inicio, omite fechas anteriores y no reinicia al cambiar de mes',()=>{
  const rows=paceSeries([{date:'2025-12-01',value:69},{date:'2026-01-01',value:70},{date:'2026-02-01',value:71},{date:'2026-03-01',value:72}],gain);
  assert.equal(rows.length,2);assert.equal(rows[0].rate,1);assert.equal(rows[1].rate,1);
  assert.equal(rows[1].status,'ideal');
});
test('kilaje usa el máximo diario del ejercicio correcto, incluido cero',()=>{
  assert.deepEqual(exerciseSeries([{fecha:'2026-01-01',ejercicio_id:'a',sets:[{peso_kg:0}]},{fecha:'2026-01-02',ejercicio_id:'a',sets:[{peso_kg:20},{peso_kg:25}]},{fecha:'2026-01-02',ejercicio_id:'a',sets:[{peso_kg:30}]},{fecha:'2026-01-02',ejercicio_id:'b',sets:[{peso_kg:100}]}],'a'),[{date:'2026-01-01',value:0},{date:'2026-01-02',value:30}]);
  const g={...gain,kind:'exercise',baseline:0,target:10};
  assert.equal(paceSeries([{date:'2026-02-01',value:1}],g)[0].rate,1);
});
test('rechaza valores incompletos, márgenes negativos y dirección contradictoria',()=>{
  assert.equal(validateGoal(gain),'');
  for(const patch of [{rate:-1},{target:69},{tolerance:-.1},{baseline:NaN},{rate:0},{startDate:'x'}])assert.ok(validateGoal({...gain,...patch}));
});
