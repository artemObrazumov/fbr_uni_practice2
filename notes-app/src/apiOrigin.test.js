import { resolveApiOrigin } from './apiOrigin';

describe('resolveApiOrigin', () => {
  it('uses same-origin in development by default', () => {
    expect(
      resolveApiOrigin({
        nodeEnv: 'development',
        configuredOrigin: 'https://localhost:3001',
        allowDirectApi: false,
      })
    ).toBe('');
  });

  it('keeps direct API origin when explicit flag is enabled', () => {
    expect(
      resolveApiOrigin({
        nodeEnv: 'development',
        configuredOrigin: 'https://localhost:3001',
        allowDirectApi: true,
      })
    ).toBe('https://localhost:3001');
  });

  it('uses configured origin outside development', () => {
    expect(
      resolveApiOrigin({
        nodeEnv: 'production',
        configuredOrigin: 'https://api.example.com',
        allowDirectApi: false,
      })
    ).toBe('https://api.example.com');
  });
});
