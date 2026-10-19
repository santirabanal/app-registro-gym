# Objetivos y gráficos

En Entrenamiento > Objetivos hay dos bloques: Peso corporal y Movimientos clave.
El segundo incluye un selector de ejercicio y conserva una meta independiente
para cada movimiento. Cada objetivo guarda peso final, ritmo en kg/mes, fecha
inicial y peso inicial. No hay margen ideal. Los objetivos antiguos siguen
funcionando; el margen que tuvieran almacenado ya no se utiliza.

En Progreso, ambos bloques permiten elegir Líneas, Barras o Ritmo objetivo.
Para ejercicios, el objetivo compara el top set (mayor peso de una serie por día).

Cada barra de Ritmo objetivo muestra:

    avance diario real = (peso actual - peso anterior) / días transcurridos
    ideal diario = objetivo mensual / cantidad de días de ese mes

Si los registros abarcan varios meses, se suma el ideal de cada día del intervalo
usando la duración real de su mes y se divide por el total de días. La referencia
es el intervalo después del registro anterior hasta el actual, inclusive.
La línea verde representa ese ideal. No se generan mediciones para días sin datos.
El primer intervalo parte de la fecha y peso inicial configurados. Cambiar el mes
visible conserva el registro anterior, aunque quede fuera del filtro.

- Amarillo: avance menor al ideal diario.
- Verde: avance igual al ideal diario (solo se ignora ruido de punto flotante).
- Rojo: avance mayor al ideal diario.

Para bajar de peso, perder más rápido es rojo y más lento es amarillo. Los colores
representan el criterio del usuario. El peso final se muestra como meta y se indica
cuando se alcanza; no cambia automáticamente el ritmo.

Los objetivos usan la clave `objetivos` de la API existente, separados por usuario.
Los cálculos, cambios de mes y años bisiestos se verifican con `npm test`.
