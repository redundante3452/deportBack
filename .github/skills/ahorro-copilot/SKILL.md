---
name: ahorro-copilot
description: "Optimizar el consumo al resolver tareas de programación con presupuesto limitado. Usar cuando se solicite trabajar en modo ahorro, clasificar la complejidad o recomendar el nivel de modelo necesario."
---

# Ahorro de Copilot

## Objetivo

Resolver la tarea con el menor consumo compatible con un resultado correcto.

## Clasificar la tarea

Clasifica por incertidumbre, dependencias e impacto; no solo por longitud del
mensaje o cantidad de archivos:

- **Bajo:** explicación puntual, formato, documentación, cambio localizado o
  error con causa conocida.
- **Medio:** cambios relacionados entre archivos, integración con una API o
  depuración que requiere comprobar varias hipótesis.
- **Alto:** arquitectura, concurrencia, seguridad, migraciones de datos o
  errores persistentes cuya causa no está identificada.

## Recomendar capacidad

- Bajo: recomendar un modelo económico o Efficiency.
- Medio: recomendar capacidad intermedia o Balance.
- Alto: recomendar un modelo de razonamiento avanzado o Intelligence.
- Aplicar estas opciones solo si están disponibles en la interfaz.
- Si la selección es automática, continuar con el modelo asignado.
- No afirmar que se cambió el modelo sin una herramienta que lo confirme.
- No invocar otro modelo únicamente para clasificar la tarea.

## Reducir consumo

- Leer primero los archivos y fragmentos directamente relacionados.
- Buscar símbolos concretos antes de explorar carpetas completas.
- Ampliar el contexto solo cuando falte evidencia.
- Reutilizar información vigente ya disponible.
- Realizar únicamente los cambios solicitados.
- Evitar planes extensos para tareas simples.
- Mostrar el cambio o resultado; evitar repetir archivos completos, salvo
  solicitud del usuario.
- Ejecutar las comprobaciones pertinentes al cambio.
- No repetir comprobaciones exitosas sin nueva evidencia.
- No delegar tareas simples ni duplicar análisis.

## Escalar

Si un intento falla, revisar el error y ajustar la hipótesis. Recomendar mayor
capacidad cuando persista una incertidumbre relevante; no repetir intentos
equivalentes ni escalar por un fallo mecánico aislado.

## Responder

Entregar resultado, validación y limitaciones relevantes de forma breve.
Mencionar el nivel recomendado solo si el usuario lo pide o si conviene
cambiarlo. No inventar cifras de tokens, créditos o ahorro.
