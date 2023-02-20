import fetch from 'cross-fetch';
import { sleep } from './utils';

const KEYCARD_API_URL = 'https://locahost:8888';

type KeycardParams = {
  applicationId: string;
  secret: string;
  keycardApiUrl?: string;
};

export class Keycard {
  applicationId: string;
  secret: string;
  keycardApiUrl: string;
  keys: { active: string[]; restricted_daily: string[]; restricted_monthly: string[] };
  constructor(params: KeycardParams) {
    this.applicationId = params.applicationId;
    this.secret = params.secret;
    this.keycardApiUrl = params.keycardApiUrl || KEYCARD_API_URL;
    this.keys = { active: [], restricted_daily: [], restricted_monthly: [] };
    this.run();
  }
  async run() {
    const keys = await this.getKeys();
    this.keys = keys[this.applicationId];
    await sleep(60e3);
    this.run();
  }
  async getKeys(): Promise<{
    [key: string]: { active: string[]; restricted_daily: string[]; restricted_monthly: string[] };
  }> {
    try {
      const response = await fetch(`${this.keycardApiUrl}/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-secret': this.secret
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'get_keys',
          params: { app: this.applicationId }
        })
      });
      const { result } = await response.json();
      return { [this.applicationId]: result[this.applicationId] };
    } catch (e) {
      console.log('[keycard] getKeys: ', e);
      return { [this.applicationId]: this.keys };
    }
  }
  async increaseCount(key: string) {
    try {
      const result = await fetch(`${this.keycardApiUrl}/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-secret': this.secret
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'increase_count',
          params: { key, app: this.applicationId }
        })
      });

      return result;
    } catch (e) {
      console.log('[keycard] increaseCount: ', e);
      return false;
    }
  }
  checkKey(key: string): {
    active: boolean;
    restricted_daily: boolean;
    restricted_monthly: boolean;
  } {
    const { active, restricted_daily, restricted_monthly } = this.keys;
    const result = { active: false, restricted_daily: false, restricted_monthly: false };
    if (active.includes(key)) result.active = true;
    if (restricted_daily.includes(key)) result.restricted_daily = true;
    if (restricted_monthly.includes(key)) result.restricted_monthly = true;
    this.increaseCount(key);
    return result;
  }
  checkHeaderKey(req, res, next) {
    const key = req.headers['x-key'] || '';
    if (!key) return res.status(401).json({ error: 'missing key' });
    const { active, restricted_daily, restricted_monthly } = this.checkKey(key);
    if (!active) return res.status(401).json({ error: 'invalid key' });
    if (restricted_daily) return res.status(429).json({ error: 'daily limit reached' });
    if (restricted_monthly) return res.status(429).json({ error: 'monthly limit reached' });

    return next();
  }
}
