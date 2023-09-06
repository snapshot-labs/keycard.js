import fetch from 'node-fetch';
import https from 'node:https';

const agentOptions = { keepAlive: true };
const agent = new https.Agent(agentOptions);
const url = 'https://keycard.snapshot.org';

fetch(url, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',

    secret: ''
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: ''
  })
}).then(response => {
  console.log('WITHOUT Agent');
  console.log(response.headers);
});

fetch(url, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',

    secret: ''
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: ''
  }),
  agent: agent
}).then(response => {
  console.log('WITH Agent');
  console.log(response.headers);
});
