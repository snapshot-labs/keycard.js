import fetch from 'cross-fetch';
import { sleep } from './utils';

const KEYCARD_API_URL = 'https://locahost:8888';

type KeycardParams = {
  app: string;
  secret?: string;
  URL?: string;
};

type AppKeys = {
  active: string[];
  restricted_monthly: string[];
};

export class Keycard {
  app: string;
  URL: string | undefined;
  configured = false;
  private secret: string | undefined;
  private keys: AppKeys = {
    active: [],
    restricted_monthly: []
  };
  constructor(params: KeycardParams) {
    this.app = params.app;
    this.secret = params.secret;
    this.URL = params.URL || KEYCARD_API_URL;
    this.checkHeader = this.checkHeader.bind(this);

    this.run();
  }
  private async run() {
    try {
      await this.getKeys();
      this.configured = true;
    } catch (e) {
      console.log(e);
    }
    await sleep(60e3);
    this.run();
  }
  private async getKeys(): Promise<void> {
    const { app } = this;
    const { result, error } = await this.callAPI('get_keys');

    if (error) {
      throw new Error(error.data);
    }
    if (result?.[app]) {
      console.log(
        '[keycard] getKeys: Success! Active keys:',
        result[app].active.length,
        'Restricted monthly keys:',
        result[app].restricted_monthly.length
      );
      this.keys = result[app];
    }
  }
  checkHeader(req, res, next) {
    if (this.configured && !res.locals.ignoreKeycardCheck) {
      const key = req.headers['x-api-key'] || '';
      if (!key) return res.status(401).json({ error: 'missing x-api-key header' });
      if (!this.keys.active.includes(key))
        return res.status(401).json({ error: 'invalid key provided' });
      if (this.keys.restricted_monthly.includes(key))
        return res.status(429).json({ error: 'monthly limit reached' });

      // Increase the total count for this key, but don't wait for it to finish.
      this.callAPI('increase_total', { key }).catch(console.log);
    }
    return next();
  }
  private async callAPI(method: string, params: any = {}) {
    const { app, URL } = this;
    const result = await fetch(`${URL}/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        secret: this.secret || ''
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
