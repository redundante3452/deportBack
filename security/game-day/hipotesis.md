# Hipótesis y métricas

Los umbrales `T1` y `T2` deben medirse en una línea base y aprobarse antes de
la Ronda 0. No son resultados actuales.

## E1 - Identidad de máquina o agente

> Dado el control de identidad de máquina configurado actualmente, cuando la
> credencial del coordinador se use desde un origen, alcance u horario no
> previsto, esperamos una señal de denegación o alerta en un tiempo `<= T1`
> minutos y la contención del acceso en un tiempo `<= T2` minutos.

Métrica objetivo: MTTD y MTTC de la identidad. Requiere una identidad y origen
de prueba propios confirmados por el grupo.

## E2 - Exposición y segmentación

> Dado el control de segmentación configurado actualmente, cuando aparezca una
> ruta no declarada hacia un servicio protegido, esperamos una señal de
> detección en un tiempo `<= T1` minutos y el bloqueo de la ruta en un tiempo
> `<= T2` minutos.

Métrica objetivo: MTTD y MTTC de la ruta. Requiere confirmar una regla o
servicio propio que pueda modificarse y revertirse.

## E3 - Telemetría e IA

> Dado el control de telemetría y separación entre datos e instrucciones,
> cuando se degrade una señal y se ingrese una instrucción en un dato sintético
> procesado por el componente de IA, esperamos una alerta o rechazo en un
> tiempo `<= T1` minutos y la contención de la acción en un tiempo `<= T2`
> minutos.

Métrica objetivo: MTTD y MTTC. El componente de IA, su entrada y sus acciones
permitidas aún no están identificados en este repositorio.

## E4 - Resiliencia de datos

> Dado el control de copia aislada e inmutabilidad configurado actualmente,
> cuando un objeto sintético sea sobrescrito, cifrado o borrado, esperamos una
> señal en un tiempo `<= T1` minutos, la contención en `<= T2` minutos y la
> recuperación con RPO y RTO dentro de los umbrales aprobados.

Métrica objetivo: MTTD, MTTC, RPO y RTO. El bucket o contenedor propio todavía
debe ser confirmado.

## Definiciones

- **MTTD:** `fin_deteccion_utc - inicio_inyeccion_utc`. Si no hay alerta dentro
  de la ventana, registrar `no detectado`.
- **MTTC:** `fin_contencion_utc - inicio_inyeccion_utc`. Si no se contiene,
  registrar `no contenido`.
- **Cobertura:** técnicas detectadas / técnicas emuladas.
- **Falso positivo:** alerta sin evento adverso en la ventana de observación /
  total de alertas de esa regla en la misma ventana.
- **RPO:** pérdida máxima observada entre el último dato confirmado y la
  restauración.
- **RTO:** `fin_recuperacion_utc - inicio_recuperacion_utc`.
