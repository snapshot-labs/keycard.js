import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const result = {
  result: {
    'snapshot-hub': {
      key_counts: {
        '1234': {
          level: 'user',
          month: 10
        },
        '12345': {
          level: 'user',
          month: 1000
        }
      },
      monthly_counts: {
        '1234': 10,
        '12345': 1000
      },
      limits: {
        monthly: 1000,
        user_monthly: 1000,
        integrator_monthly: 1000
      }
    }
  }
};

export const restHandlers = [
  rest.post('http://localhost:3007', (req: any, res: any, ctx) => {
    console.log('req', req.body);
    if (req.body?.method === 'get_keys') {
      return res(ctx.status(200), ctx.json(result));
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
