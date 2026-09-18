import { AppController } from './app.controller';

describe('AppController', () => {
  it('reports the CareCircle service as healthy', () => {
    const response = new AppController().health();
    expect(response.status).toBe('ok');
    expect(response.service).toBe('CareCircle API');
    expect(response.version).toBe('1.0.0');
  });
});
