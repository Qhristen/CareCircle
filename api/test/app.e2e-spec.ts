import { AppController } from '../src/app.controller';

describe('AppController', () => {
  it('returns GiftCircle health information', () => {
    const response = new AppController().health();
    expect(response.status).toBe('ok');
    expect(response.service).toBe('GiftCircle API');
  });
});
