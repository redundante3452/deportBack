import http from 'k6/http';
import { check } from 'k6';

const baseUrl = __ENV.BASE_URL;
const apiKey = __ENV.API_KEY;
const deportistaId = __ENV.DEPORTISTA_ID;

if (!baseUrl || !deportistaId) {
  throw new Error('BASE_URL y DEPORTISTA_ID son obligatorios');
}

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '2m',
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
    { headers },
  );

  check(response, {
    'flujo responde': (res) => res.status === 200,
    'propaga trace id': (res) => res.headers['X-Trace-Id'] === traceId,
  });
}
