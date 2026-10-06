import { describe, expect, it } from '@jest/globals';

import { env } from '@/config/env';

import { isPublicOrigin, receiveUrl, shareHost } from './receiveUrl';

describe('isPublicOrigin', () => {
  it('rejects addresses only the sharing device can resolve', () => {
    expect(isPublicOrigin('http://localhost:8081')).toBe(false);
    expect(isPublicOrigin('http://127.0.0.1:8081')).toBe(false);
    expect(isPublicOrigin('http://192.168.1.42:8081')).toBe(false);
    expect(isPublicOrigin('http://10.0.0.7:8081')).toBe(false);
    expect(isPublicOrigin('http://172.16.4.1:8081')).toBe(false);
    expect(isPublicOrigin('http://macbook.local:8081')).toBe(false);
  });

  it('rejects non-http schemes, including native deep links', () => {
    expect(isPublicOrigin('tripit://')).toBe(false);
    expect(isPublicOrigin('exp://192.168.1.42:8081')).toBe(false);
    expect(isPublicOrigin('')).toBe(false);
  });

  it('accepts an address another phone can open', () => {
    expect(isPublicOrigin('https://tripit-app.github.io')).toBe(true);
    expect(isPublicOrigin('http://172.32.0.1')).toBe(true);
  });
});

describe('receiveUrl', () => {
  it('falls back to the public app when the app is served locally', () => {
    expect(receiveUrl('ABCDEFGH', 'http://localhost:8081')).toBe(
      `${env.publicWebUrl}/receive?code=ABCDEFGH`,
    );
  });

  it('stays on the origin it is already served from when that is public', () => {
    expect(receiveUrl('ABCDEFGH', 'https://trips.example.com')).toBe(
      'https://trips.example.com/receive?code=ABCDEFGH',
    );
  });

  it('names the host the QR will open', () => {
    expect(shareHost('http://localhost:8081')).toBe('tripit-app.github.io');
    expect(shareHost('https://trips.example.com')).toBe('trips.example.com');
  });
});
