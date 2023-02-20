import { Keycard } from '../src/index';

const keycard = new Keycard({
  applicationId: 'snapshot-hub',
  secret: '',
  keycardApiUrl: 'http://localhost:8888'
});

(async () => {
  console.log('keys', keycard.keys);

  const keys = await keycard.getKeys();
  console.log('keys', keys);

  const result = await keycard.increaseCount('test');
  console.log('result', result);

  keycard.checkKey('4AF6929E3DF2A2148E1416307259C5FD');
})();
