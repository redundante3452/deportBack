# Informe de Game Day de Caos de Seguridad

> El informe completo y vigente está en [docs/informe-seguridad.md](../docs/informe-seguridad.md). Este archivo conserva la estructura de la plantilla.

## 1. Resumen ejecutivo

E4 ejecutado (2026-11-17): R0 no detectado ni contenido, 50/50 borrados, RPO 50 registros; R1 MTTD 37,5 s, MTTC 1,9 s, 20/50 borrados, RPO 0, RTO 1043 s. E1–E3: pendiente.

## 2. Arquitectura y fronteras de confianza

Incluir el diagrama multinube, propietarios, puntos de inyección y fuentes de
telemetría. Diferenciar lo comprobado en código de lo verificado en nube.

## 3. Estado estable y reglas de compromiso

Referenciar [estado-estable.md](game-day/estado-estable.md) y
[reglas-compromiso.md](game-day/reglas-compromiso.md).

## 4. Inventario y trazabilidad

Referenciar [inventario-controles.md](game-day/inventario-controles.md) y
[matriz-trazabilidad.md](game-day/matriz-trazabilidad.md). Completar los
identificadores después de verificarlos en fuentes primarias.

## 5. Experimentos

Para cada E1–E4 incluir responsable, hipótesis, precondiciones, alcance,
inyección, señales, parada, reversión, cronología y evidencias de las dos
rondas.

## 6. Comparación de rondas

| Experimento | Ronda | MTTD | MTTC | Cobertura | Falsos positivos | RPO | RTO |
|---|---:|---|---|---|---|---|---|
| E1 | 0/1 | no medido | no medido | no medido | no medido | N/A | N/A |
| E2 | 0/1 | no medido | no medido | no medido | no medido | N/A | N/A |
| E3 | 0/1 | no medido | no medido | no medido | no medido | N/A | N/A |
| E4 | 0/1 | no medido | no medido | no medido | no medido | no medido | no medido |

## 7. IA y tendencias

Registrar herramienta, versión, fecha, propuesta, evidencia contrastada,
aciertos, invenciones y decisiones descartadas. Documentar las dos tendencias
que el grupo implemente o instrumente con fuentes primarias.

## 8. Mejoras y riesgos residuales

Registrar al menos dos mejoras por integrante, su control afectado y la
evidencia de la Ronda 1.

## 9. Lecciones y próximos experimentos

Pendiente de ejecución.
