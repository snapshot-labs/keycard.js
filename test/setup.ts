import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const exampleResponse = {
  result: {
    'snapshot-hub': {
      key_counts: {
        '1234': {
          tier: 0,
          month: 10
        },
        '12345': {
          tier: 1,
          month: 2000
        }
      },
      limits: {
        '0': {
          monthly: 1000
        },
        '1': {
          monthly: 2000
        }
      }
    }
  }
};

export const restHandlers = [
  rest.post('http://localhost:3007', (req: any, res: any, ctx) => {
    console.log('req', req.body);
    if (req.body?.method === 'get_keys') {
      return res(ctx.status(200), ctx.json(exampleResponse));
    }
    return res(
      ctx.status(200),
      ctx.json({
        success: true
      })
    );
  })
];

const server = setupServer(...restHandlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

//  Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());
