import fetch from 'cross-fetch';
import { sleep } from './utils';

const API_URL = 'https://locahost:3002';
const API_INTERVAL = 30e3;

type KeycardParams = {
  app: string;
  secret?: string;
  URL?: string | URL;
};

type AppKeys = {
  active: string[];
  restricted_monthly: string[];
};

export class Keycard {
  app: string;
  URL: string | URL;
  configured = false;
  private secret: string | undefined;
  private keys: AppKeys = {
    active: [],
    restricted_monthly: []
  };

  constructor(params: KeycardParams) {
    this.app = params.app;
    this.secret = params.secret;
    this.URL = params.URL || API_URL;

    if (!this.secret) {
      console.log('[keycard] No secret provided, skipping keycard.');
      return;
    }
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
      // Useful to debug, Uncomment this to see the keys in the console.
      // console.log(
      //   '[keycard] getKeys: Success! Active keys:',
      //   result[app].active.length,
      //   'Restricted monthly keys:',
      //   result[app].restricted_monthly.length
      // );
      this.keys = result[app];
    }
    return this.keys;
  }

  logReq(key: string): { valid: boolean; rateLimited?: boolean } {
    if (key && this.configured) {
      if (!this.keys.active.includes(key)) return { valid: false };
      if (this.keys.restricted_monthly.includes(key)) return { valid: true, rateLimited: true };

      // Increase the total count for this key, but don't wait for it to finish.
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      this.callAPI('log_req', { key }).catch(() => {});
    }
    // If the keycard doesn't receive any keys (incase of a restart), we don't want to block the request.
    return { valid: true, rateLimited: false };
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
