import http from 'k6/http';
import { check } from 'k6';

const baseUrl = __ENV.BASE_URL;
const apiKey = __ENV.API_KEY;
const deportistaId = __ENV.DEPORTISTA_ID;

if (!baseUrl || !deportistaId) {
  throw new Error('BASE_URL y DEPORTISTA_ID son obligatorios');
}

// Perfil de carga FIJO y DECLARADO: identico en Ronda 0 y Ronda 1.
// No es sobreescribible por env (no usar VUS/DURATION). Total: 4m30s.
export const PERFIL_CARGA = {
  nombre: 'perfil-p1-v1',
  stages: [
    { duration: '30s', target: 5 }, // rampa 0 -> 5
    { duration: '1m30s', target: 5 }, // meseta 5
    { duration: '30s', target: 10 }, // escalon 5 -> 10
    { duration: '1m30s', target: 10 }, // meseta 10
    { duration: '30s', target: 0 }, // bajada a 0
  ],
};

const round = __ENV.ROUND || 'sin-ronda';

export const options = {
  stages: PERFIL_CARGA.stages,
  thresholds: {
    http_req_failed: [`rate<${__ENV.MAX_ERROR_RATE || 0.01}`],
    http_req_duration: [`p(95)<${__ENV.MAX_P95_MS || 1000}`],
  },
};

export default function () {
  const traceId = `k6-${__VU}-${__ITER}-${Date.now()}`;
  const headers = {
    'X-Trace-Id': traceId,
  };

  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  const response = http.get(
    `${baseUrl}/api/v2/deportistas/${deportistaId}`,
    { headers, tags: { perfil: PERFIL_CARGA.nombre, round } },
  );

  check(response, {
    'flujo responde': (res) => res.status === 200,
    'propaga trace id': (res) => res.headers['X-Trace-Id'] === traceId,
  });
}
