# Reglas de compromiso

## Estado

Pendiente de aceptación explícita de los tres integrantes. Este documento
define el límite de seguridad; no autoriza por sí solo la ejecución.

## Alcance autorizado

- Proyecto GCP y clúster GKE pertenecientes al grupo.
- APIs y cuentas de Inventario-U, deport-back y api-fastify que el grupo
  confirme como propias.
- Datos sintéticos y desechables.
- Recursos identificados por nombre, proyecto, suscripción o cuenta antes de
  cada ronda.

Queda prohibido actuar sobre recursos de la Universidad, terceros u otros
grupos. No se usarán IPs públicas como objetivo sin confirmar su propiedad.

## Ventana y responsables

| Dato | Valor |
|---|---|
| Fecha y hora UTC | Pendiente de acordar |
| Coordinador | Inventario-U, pendiente de aceptación |
| Responsable E1 | Pendiente de confirmar |
| Responsable E2 | deport-back, pendiente de aceptación |
| Responsable E3 | api-fastify, pendiente de aceptación |
| Responsable E4 | Grupo completo |
| Canal de comunicación | Pendiente de acordar |

## Datos y radio de impacto

- Usar únicamente identificadores sintéticos.
- Mantener cada experimento limitado a su recurso objetivo.
- No borrar datos productivos ni modificar identidades administrativas.
- No probar credenciales reales de personas.
- No modificar reglas compartidas sin una copia y un plan de reversión.

## Interruptor de parada

La ejecución debe detenerse si ocurre cualquiera de estas condiciones:

1. Se afecta un recurso fuera del inventario autorizado.
2. Se pierde la trazabilidad del `trace_id`.
3. La tasa de error del flujo supera el umbral acordado.
4. Se afecta una operación administrativa o de recuperación.
5. El equipo no puede comprobar la reversión.
6. La ventana autorizada termina.

El responsable ejecutará el interruptor de parada del experimento y avisará al
coordinador. Cada experimento debe documentar el comando o acción exacta antes
de iniciar.

## Reversión

La reversión se prueba antes de la inyección destructiva. Debe:

- retirar la regla, recurso o variable de caos;
- restaurar la configuración inicial;
- confirmar pods, servicios, identidades y rutas;
- comprobar una petición sintética completa;
- registrar hora UTC, ejecutor y resultado.

## Bitácora mínima

Cada evento debe registrar:

```text
timestamp_utc, execution_id, round, experiment, trace_id, actor,
action, resource, expected_signal, observed_signal, status
```

No se aceptan resultados fabricados ni capturas sin identificador de ejecución.
