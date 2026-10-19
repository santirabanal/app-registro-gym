# Objetivos y gráficos

En Entrenamiento > Objetivos se guarda una meta de peso corporal y una por cada
ejercicio activo. Cada meta incluye peso final, ritmo en kg/mes, margen en
kg/mes, fecha inicial y peso inicial. Los objetivos usan la clave `objetivos`
de la API existente y quedan separados por el usuario autenticado.

En Progreso, ambos bloques permiten elegir Líneas, Barras o Ritmo objetivo.
En ejercicios, el ritmo objetivo siempre utiliza el top set (mayor peso de
una serie por día), aunque el gráfico de líneas o barras tenga seleccionada
otra métrica. No compara volumen con un objetivo de kilaje.

El ritmo mensual equivalente es el cambio de peso desde el punto inicial
dividido por los meses transcurridos. Se usan meses de calendario anclados
a la fecha inicial, ajustando fechas de fin de mes. Cambiar el mes visible
filtra los puntos, sin reiniciar el objetivo. El día inicial no produce una
barra porque todavía no transcurrió tiempo.

- Amarillo: progreso más lento que el límite inferior configurado.
- Verde: ritmo dentro del ideal más/menos el margen, límites incluidos.
- Rojo: progreso más rápido que el límite superior configurado.

En pérdida de peso la comparación considera la magnitud de la pérdida:
para -1 ±0,2 kg/mes, -0,7 es amarillo, -1 es verde y -1,3 es rojo.
Los colores representan el criterio del usuario. El peso final se muestra
como meta y se indica cuando se alcanza; no cambia automáticamente el ritmo.

El cálculo y sus casos límite se verifican con `npm test`.
