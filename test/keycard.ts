import { Keycard } from '../src';

const keycard = new Keycard({
  app: 'snapshot-hub',
  secret: '',
  URL: 'http://localhost:8888'
});

(async () => {
  console.log('keys', keycard.app);
})();
