# Experimentos de caos

El experimento `experiments/dependency-unavailable.yaml` usa `NetworkChaos`
de Chaos Mesh para bloquear temporalmente la dependencia marcada con
`chaos-target: external-dependency`. El selector debe apuntar únicamente a
recursos de la cuenta del grupo; no se debe aplicar contra una IP o servicio
de terceros.
El namespace `integrations` y la etiqueta del objetivo deben corresponder a
una dependencia Kubernetes propia del grupo; Terraform no crea un mock ni una
dependencia ficticia. Si la dependencia está en otra nube, el interruptor de
la aplicación es el mecanismo de inyección y este manifiesto declarativo se
reserva para una instancia propia controlada.

Como alternativa para pruebas locales o dependencias que la herramienta no
pueda interceptar, la aplicación admite:

```text
CHAOS_DEPENDENCY_FAILURE=true
CHAOS_DEPENDENCY_TARGET=api-fastify
```

El interruptor no está activo por defecto. El circuito se abre después de tres
fallos consecutivos durante 30 segundos y las respuestas externas degradadas
se conservan sin cachear errores.

La aplicación registra cada fallo como el evento estructurado
`dependency_failure`. Terraform crea una métrica y un dashboard de caos con
esa señal, la latencia y los errores 5xx. El dashboard se crea al aplicar
`google_monitoring_dashboard.chaos`.

La ejecución evaluable es exclusivamente sobre GKE/GCP. Las pruebas locales
solo pueden validar compilación o sintaxis; no cuentan como Ronda 0 ni Ronda 1
y no deben presentarse como evidencia del experimento.

Antes de ejecutar en cloud:

1. Verificar que la dependencia sea propia y use datos sintéticos.
2. Confirmar la ventana y el blast radius con el grupo.
3. Medir la línea base con `load/k6-flow.js`.
4. Probar la reversión eliminando el recurso `NetworkChaos` y restaurando las
   variables de entorno.

Ejecución en GKE:

```bash
export BASE_URL=https://<url-real-de-gke>
export DEPORTISTA_ID=<id-sintetico-real>
export API_KEY=<secreto-del-grupo>
export CHAOS_TARGET=<dependencia-propia>
export CHAOS_CONFIRM=true
export ROUND=0
bash scripts/run-chaos-experiment.sh
```

Para ejecutar una ronda sobre GKE se usa
`scripts/run-chaos-experiment.sh`. Requiere `kubectl`, `k6`, contexto GKE,
`BASE_URL`, `DEPORTISTA_ID`, `API_KEY` y `CHAOS_TARGET`. Sin
`CHAOS_CONFIRM=true` solo valida la configuración; al terminar, el script
elimina el recurso de caos, restaura las variables y espera el rollout estable.

La Ronda 1 se ejecuta repitiendo el mismo comando con `ROUND=1`. El perfil de
carga, la duración, el fallo y el instrumento deben ser idénticos a la Ronda 0.
Los resultados y el dashboard de Cloud Monitoring son la evidencia oficial.
