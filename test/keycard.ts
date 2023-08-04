import { Keycard } from '../src';
import { sleep } from '../src/utils';

(async () => {
  const keycard = new Keycard({
    app: 'snapshot-hub',
    secret: '1234',
    URL: 'http://localhost:3007'
  });
  console.log('Keycard:', keycard);
  await sleep(1000);
  console.log('Configured:', keycard.configured);
  console.log('Keys:', await keycard.getKeys());
  console.log('logReq:', keycard.logReq('123456789'));
})();
