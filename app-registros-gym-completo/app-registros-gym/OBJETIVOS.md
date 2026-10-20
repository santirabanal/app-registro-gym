# Objetivos y promedio diario

Objetivos mantiene un bloque de Peso corporal y un bloque de Movimientos clave
con selector. Cada movimiento conserva su propia meta y ritmo mensual.

En Progreso, Promedio diario calcula para cada registro:

    promedio diario = (peso registrado - peso inicial del objetivo) / días transcurridos

Es un promedio acumulado desde la fecha inicial, ponderado por tiempo transcurrido.
No es el salto desde la medición anterior ni el promedio simple de los pesos.
No se divide por cero: la fecha inicial no genera una barra.

El eje Y usa gramos/día. La línea horizontal ideal es el ritmo mensual dividido
por los días del mes seleccionado (en la vista de 3 meses se usa el último mes).
La tolerancia fija mensual de ±200 g se convierte de la misma manera a g/día.

Cada barra se divide en partes apiladas:

- Amarillo hasta el límite inferior del rango ideal.
- Verde para la parte comprendida dentro del rango.
- Rojo únicamente para la parte que excede el límite superior.

La suma de las tres partes es el promedio real. Si está por debajo del rango,
la barra es toda amarilla; si está dentro, incluye base amarilla y tramo verde;
si excede el rango, incluye también el tramo rojo. Los colores son tramos, no
una calificación uniforme de toda la barra. El tooltip muestra el estado global.

Al bajar, tanto la referencia como las partes son negativas. Un cambio en la
dirección contraria al objetivo es amarillo al otro lado de cero.

Solo los días con registros generan barras. Los días sin datos cuentan en el
tiempo transcurrido, pero no se inventan mediciones. Cambiar el filtro mensual
no reinicia el promedio ni modifica los registros anteriores.

No hace falta migrar los objetivos existentes ni modificar la base de datos.
Se conserva la separación por usuario autenticado. `npm test` verifica cálculos,
suma de segmentos, límites y pérdida de peso.
