import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const result = {
  result: {
    'snapshot-hub': { active: ['1234', '12345'], restricted_monthly: ['12345'] }
  }
};

export const restHandlers = [
  rest.post('http://localhost:3002', (req: any, res: any, ctx) => {
    console.log('req', req.body);
    if (req.body?.method === 'get_keys') {
      return res(ctx.status(200), ctx.json(result));
    }
    return res(ctx.status(200), ctx.json(posts));
  })
];

const server = setupServer(...restHandlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

//  Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());
