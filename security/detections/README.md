# Detección como código

Las reglas se versionarán en el lenguaje que soporte la plataforma confirmada:
Cloud Monitoring/Logging, Azure Monitor, OCI Logging, Sigma, KQL o SPL. No se
elige una sintaxis sin conocer el SIEM o servicio real.

Cada regla deberá incluir:

1. nombre y versión;
2. técnica y control evaluado;
3. consulta o condición;
4. ventana;
5. severidad;
6. caso positivo sintético;
7. caso negativo del flujo normal;
8. evento de inicio para MTTD;
9. evento de contención para MTTC;
10. responsable de revisión.

## Reglas pendientes de implementación

- `identity-unexpected-origin`: E1.
- `undeclared-route-or-east-west-access`: E2.
- `telemetry-heartbeat-missing`: E3.
- `synthetic-data-protection-event`: E4.

No se declaran activas hasta probar cada caso positivo y negativo en la
plataforma real.
