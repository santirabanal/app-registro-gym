# Objetivos y gráficos

Entrenamiento > Objetivos tiene dos bloques: Peso corporal y Movimientos clave.
El segundo permite seleccionar un ejercicio y conserva su objetivo por separado.
Cada meta guarda peso final, ritmo mensual, fecha inicial y peso inicial.

Progreso ofrece Líneas, Barras y Recorrido del objetivo. Este último muestra
peso real en kg frente al peso que debería llevar el usuario según su plan.
No muestra una velocidad mensual ni compara con el registro inmediatamente anterior.

    peso esperado = peso inicial + avance ideal desde la fecha inicial
    avance diario ideal = ritmo mensual / días de ese mes

La referencia suma cada día transcurrido (desde el inicio inclusive hasta la
fecha del punto exclusive) usando los días reales de cada mes. Al alcanzar el
peso objetivo, la línea esperada se mantiene en la meta.

La franja verde tiene 400 g de ancho total, constantes: ±0,2 kg alrededor del
peso esperado en cada fecha. Las barras reales se colorean:

- Verde dentro de la franja, incluidos los límites.
- Amarillo si el avance está por debajo del plan.
- Rojo si está por encima del plan.

Al bajar, perder más de lo previsto es rojo y menos de lo previsto es amarillo.
Las barras representan registros reales; no se inventan mediciones para los días
sin datos. La referencia y su franja sí se dibujan diariamente, incluso en fechas
futuras del mes visible. Si falta un registro en la fecha inicial, el punto inicial
configurado se muestra y se identifica como tal en el tooltip.

Cambiar el mes visible no reinicia el plan. En ejercicios se utiliza el top set
(mayor peso de una serie por día). Los objetivos existentes siguen funcionando.
No hace falta migrar la base; se conserva la API y la separación por usuario.

Ejemplo: desde 75 kg el 1 de noviembre, con +1 kg/mes, el esperado es 75,33 kg
el día 11 (10 días transcurridos), 75,67 el día 21 y 76 kg el 1 de diciembre.

Los cálculos y límites se verifican con `npm test`.
