import { AppController } from './app.controller';

describe('AppController', () => {
  it('reports the GiftCircle service as healthy', () => {
    const response = new AppController().health();
    expect(response.status).toBe('ok');
    expect(response.service).toBe('GiftCircle API');
    expect(response.version).toBe('1.0.0');
  });
});
