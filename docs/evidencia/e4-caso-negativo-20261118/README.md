# E4 - caso negativo (trafico legitimo bajo el umbral)

Objetivo: comprobar que la alerta "E4 - Borrado masivo de deportistas" (umbral >= 10 borrados en 5 min) NO se dispara con 5 borrados espaciados 60 s.

## Intento 1 - INVALIDADO por contaminacion

Workflow "Game Day E4", run 44232516003, execution_id `gd-exp4-neg-20261118T034504Z`. Carpeta: `intento1/`.

- Arranque 03:45:04Z; alerta en `normal` (03:45:06Z); se sembraron 5; primer DELETE 03:45:26Z -> la alerta paso a `firing` 03:45:27Z -> veredicto del script: FALLA. La limpieza borro los 4 restantes.
- **Causa verificada**: la reversion de la R1 repeticion (03:42:42Z) borro los 50 sinteticos por API; Cloud Monitoring `deportistas-deleted` 26 + 24 = 50 en el bucket de 03:44 UTC. La metrica basada en logs llega con 1-2 min de retraso, por eso el estado seguia en `normal` al arrancar.
- **Conclusion**: no es un falso positivo del trafico legitimo, sino otra instancia del FP conocido "la reversion propia dispara la alerta". El intento no es valido como prueba del caso negativo.
- Mejora propuesta: silenciar la alerta durante la reversion y/o esperar una ventana limpia (sin borrados previos) antes de iniciar.

## Intento 2

Workflow "Game Day E4", run 44233528772 (exito), execution_id `gd-exp4-neg-20261118T035358Z`. Carpeta: `intento2/`.

- Arranque 03:53:58Z con la alerta en `normal` (ventana limpia: ultimo borrado previo 03:45-03:46Z, mas de 5 min antes).
- Siembra de 5 deportistas `e4-<n>-neg035358@example.com`; borrados 03:54:19, 03:55:24, 03:56:29, 03:57:33 y 03:58:21Z, todos HTTP 200.
- Observacion del estado de la alerta cada 15 s durante 360 s (24 lecturas, todas `normal`; fin 04:00:34Z).
- **Veredicto: PASA** (`alerta_disparada: false`, la alerta nunca paso a firing).
- **Conclusion**: el trafico legitimo bajo el umbral (5 borrados en ~4 min < 10 en 5 min) no genera falso positivo en infraestructura real.
