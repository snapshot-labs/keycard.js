import { Keycard } from '../src';

(async () => {
  const keycard = new Keycard({
    app: 'snapshot-hub',
    secret: '1234',
    URL: 'http://localhost:3002'
  });
  console.log('Keycard:', keycard);
  await new Promise(resolve => setTimeout(resolve, 5e3));
  console.log('Configured:', keycard.configured);
  console.log('Keys:', await keycard.getKeys());
  console.log('logReq:', keycard.logReq('ABC'));
})();
