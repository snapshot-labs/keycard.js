import fetch from 'cross-fetch';
import { sleep } from './utils';

const API_URL = 'https://locahost:3007';
const API_INTERVAL = 30e3;

type KeycardParams = {
  app: string;
  secret?: string;
  URL?: string | URL;
};

type AppKeys = {
  // TODO: active and restricted_monthly will be deprecated in the future.
  active: string[];
  restricted_monthly: string[];
  monthly_counts: Record<string, number>;
  limits: Record<string, number>;
  reset: number;
};

export class Keycard {
  app: string;
  URL: string | URL;
  configured = false;
  private secret: string | undefined;
  private keys: AppKeys = {
    // TODO: active and restricted_monthly will be deprecated in the future.
    active: [],
    restricted_monthly: [],
    monthly_counts: {},
    limits: {},
    reset: 0
  };

  constructor(params: KeycardParams) {
    this.app = params.app;
    this.secret = params.secret;
    this.URL = params.URL || API_URL;

    if (!this.secret) {
      console.log('[keycard] No secret provided, skipping keycard.');
      return;
    }
    console.log('[keycard] Initializing keycard...');
    this.run();
  }

  private async run() {
    try {
      await this.getKeys();
      this.configured = true;
    } catch (e: any) {
      console.log('[keycard]', e.message || e);
    }
    await sleep(API_INTERVAL);
    this.run();
  }

  async getKeys(): Promise<AppKeys> {
    const { app } = this;
    const { result } = await this.callAPI('get_keys');
    if (result?.[app]) {
      this.keys = result[app];
    }
    return this.keys;
  }

  logReq(key: string): {
    valid: boolean;
    rateLimited?: boolean;
    remaining?: number;
    reset?: number;
    limit?: number;
  } {
    if (!key) return { valid: false };

    const { monthly_counts: activeKeys, limits, reset } = this.keys;
    const { secret } = this;
    const limit = limits.monthly;

    // If key is not in active keys, it's not valid.
    if (activeKeys[key] === undefined) return { valid: false };

    activeKeys[key]++;
    let keyCount = activeKeys[key];

    // Unlimited requests to snapshot APIs (example: if hub is sending requests to hub itself or to score-api)
    const unlimitedRequests = key === secret;
    if (unlimitedRequests) keyCount = 0;
    // Increase the total count for this key, but don't wait for it to finish.
    if (!unlimitedRequests) this.callAPI('log_req', { key }).catch();

    const rateLimited = keyCount > limit;

    return {
      valid: true,
      rateLimited,
      remaining: rateLimited ? 0 : limits.monthly - keyCount,
      reset: reset,
      limit
    };
  }

  private async callAPI(method: string, params: any = {}) {
    const { URL, app, secret } = this;
    const result = await fetch(URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        secret: secret || ''
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params: { app, ...params }
      })
    });
    return result.json();
  }
}
