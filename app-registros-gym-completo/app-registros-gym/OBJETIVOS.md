# Objetivos y gráficos

Entrenamiento > Objetivos tiene dos bloques: Peso corporal y Movimientos clave.
El segundo incluye un selector y conserva una meta independiente por movimiento.
Se guarda peso final, ritmo mensual, fecha y peso inicial. El margen no es editable.

Progreso permite elegir Líneas, Barras o Ritmo objetivo. En ejercicios se compara
el top set (mayor peso de una serie por día).

Ritmo objetivo usa kg/mes en el eje Y:

- Línea horizontal fija en el ritmo ideal mensual.
- Franja verde fija de 400 g/mes de ancho total (ideal ±0,2 kg/mes).
- Barras del ritmo observado entre registros, expresado en kg/mes.

Para un ideal de +1 kg/mes, +0,8 y +1,2 son verdes (límites incluidos).
Por debajo es amarillo y por encima es rojo. Al bajar, perder más rápido
que el límite es rojo y más lento es amarillo.

El ritmo observado es el cambio entre registros dividido por la fracción de mes
transcurrida. Cada día vale 1/cantidad de días de su mes. Así el cálculo contempla
febrero, años bisiestos e intervalos que cruzan de mes sin inclinar la referencia.
No se inventan mediciones. El primer intervalo parte del inicio configurado;
filtrar el mes visible conserva el registro previo aunque quede fuera del filtro.

La tolerancia antigua que pudiera estar guardada se ignora: siempre se usa ±0,2.
Los objetivos usan la API existente y quedan separados por usuario autenticado.
Los cálculos y límites se verifican con `npm test`.
