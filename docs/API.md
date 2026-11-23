# Contrato de la API (fuente de verdad)

Este panel es **consumidor** de la API de Nocturna. El contrato canónico NO vive
en este repositorio para evitar copias que se desactualicen:

👉 [`docs/api-contract.md` en `JPerez991/Tienda-Nocturna`](https://github.com/JPerez991/Tienda-Nocturna/blob/main/docs/api-contract.md)

## Reglas

- Si el código y el contrato discrepan, se corrige el código (o se actualiza el
  contrato explícitamente en el repo principal).
- Si el panel necesita un dato nuevo, se escribe en **"Notas para BACKEND"** de
  ese contrato (sección *"Notas para FRONTEND (las escribe el BACKEND)"* más
  abajo en el protocolo de agentes). El backend lo implementa y lo mueve al
  contrato; recién entonces el panel ajusta `src/lib/types.ts` y la UI.
- **No se inventan endpoints** y no se duplica el contrato aquí.

## Estado de los datos del panel

La sesión (`POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`)
ya está en el contrato. Los datos enriquecidos que pide este panel (ficha
técnica, atributos por tipo de artículo, colores con hex, vigencia de ofertas,
filtros de preguntas, corrección/eliminación e historial) están solicitados en
la **nota 20** del contrato. Mientras el backend no los confirme, la UI usa los
campos actuales y degrada limpiamente.
