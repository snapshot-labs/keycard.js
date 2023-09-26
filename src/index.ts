import fetch from 'node-fetch';
import http from 'node:http';
import https from 'node:https';
import { sleep } from './utils';

const API_URL = 'https://locahost:3007';
const API_INTERVAL = 30e3;

type KeycardParams = {
  app: string;
  secret?: string;
  URL?: string | URL;
};

type AppKeys = {
  key_counts: Record<string, { level: string; month: number }>;
  limits: Record<string, number>;
  reset: number;
};

export class Keycard {
  app: string;
  URL: string | URL;
  agent?: http.Agent | https.Agent;
  configured = false;
  private secret: string | undefined;
  private keys: AppKeys = {
    key_counts: {},
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

    const agentOptions = { keepAlive: true };
    this.agent =
      new URL(this.URL).protocol === 'http:'
        ? new http.Agent(agentOptions)
        : new https.Agent(agentOptions);

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

    const { key_counts: activeKeys, limits, reset } = this.keys;
    const { secret } = this;
    const keyData = activeKeys[key];

    // Unlimited requests to snapshot APIs (example: if hub is sending requests to hub itself or to score-api)
    const unlimitedRequests = key === secret;

    // If key is not in active keys, it's not valid.
    if (!unlimitedRequests && keyData === undefined) return { valid: false };

    keyData.month++;
    let keyCount = keyData.month;

    if (unlimitedRequests) keyCount = 0;
    // Increase the total count for this key, but don't wait for it to finish.
    if (!unlimitedRequests) this.callAPI('log_req', { key }).catch(console.error);

    const limit = limits[`${keyData.level}_monthly`];
    const rateLimited = keyCount > limit;
    return {
      valid: true,
      rateLimited,
      remaining: Math.max(0, limit - keyCount),
      reset,
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
      }),
      timeout: 5e3,
      agent: this.agent
    });
    return result.json();
  }
}
