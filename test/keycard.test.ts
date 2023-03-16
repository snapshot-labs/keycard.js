import { describe, expect, it } from 'vitest';
import { Keycard } from '../src';

describe('Test keyCard if no secret is passed', () => {
  let keycard: any = undefined;
  it('should create a new instance of Keycard', () => {
    keycard = new Keycard({
      app: 'snapshot-hub',
      secret: '',
      URL: 'http://localhost:3002'
    });
    expect(keycard).toBeInstanceOf(Keycard);
  });

  it('should return false for configured value', () => {
    expect(keycard.configured).toBe(false);
  });

  it('should return empty arrays for keys', () => {
    expect(keycard.keys).toMatchObject({
      active: [],
      restricted_monthly: []
    });
  });
});
