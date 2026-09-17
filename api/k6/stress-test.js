import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '40s', target: 25 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<750'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

export default function () {
  const health = http.get(`${baseUrl}`);
  check(health, { 'health is OK': (response) => response.status === 200 });

  const community = http.get(`${baseUrl}/circles/discover?page=1&limit=20`);
  check(community, { 'community circles load': (response) => response.status === 200 });
  sleep(1);
}
