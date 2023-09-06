import { describe, expect, it } from 'vitest';
import { Keycard } from '../src';

describe('Test keyCard if no secret is passed', () => {
  let keycard: any = undefined;
  it('should create a new instance of Keycard', async () => {
    keycard = new Keycard({
      app: 'snapshot-hub',
      secret: '',
      URL: 'http://localhost:3007'
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(keycard).toBeInstanceOf(Keycard);
  });

  it('should return false for configured value', () => {
    expect(keycard.configured).toBe(false);
  });

  it('should return empty objects for keys', () => {
    expect(keycard.keys).toMatchObject({
      limits: {},
      monthly_counts: {},
      reset: 0
    });
  });
});

describe('Test keyCard if secret is passed', () => {
  let keycard: any = undefined;
  it('should create a new instance of Keycard', async () => {
    keycard = new Keycard({
      app: 'snapshot-hub',
      secret: 'test',
      URL: 'http://localhost:3007'
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(keycard).toBeInstanceOf(Keycard);
  });

  it('getKeys should add keys to keycard.keys', async () => {
    await keycard.getKeys();
    expect(keycard.keys).toMatchObject({
      monthly_counts: {
        '1234': 10,
        '12345': 1000
      },
      limits: {
        monthly: 1000
      },
    });
  });

  it('should return true for configured value', () => {
    expect(keycard.configured).toBe(true);
  });

  it('calling logReq with valid should return that key is valid and not rate limited', () => {
    const { valid, rateLimited } = keycard.logReq('1234');
    expect(valid).toBe(true);
    expect(rateLimited).toBe(false);
  });

  it('calling logReq with invalid should return that key is not valid', () => {
    const { valid, rateLimited } = keycard.logReq('testKey');
    expect(valid).toBe(false);
    expect(rateLimited).toBe(undefined);
  });

  it('calling logReq with restricted key should return that key is valid and rate limited', () => {
    const { valid, rateLimited } = keycard.logReq('12345');
    expect(valid).toBe(true);
    expect(rateLimited).toBe(true);
  });
});
