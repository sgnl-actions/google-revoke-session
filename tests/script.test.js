import script from '../src/script.mjs';

describe('Google Revoke Session Script', () => {
  const mockContext = {
    env: {
      ENVIRONMENT: 'test'
    },
    secrets: {
      BEARER_AUTH_TOKEN: 'test-google-token-123456'
    },
    outputs: {}
  };

  let originalFetch;
  let originalURL;

  beforeAll(() => {
    // Save original global functions
    originalFetch = global.fetch;
    originalURL = global.URL;
  });

  beforeEach(() => {
    // Mock fetch
    global.fetch = () => Promise.resolve({
      ok: true,
      status: 204
    });

    // Mock URL constructor
    global.URL = class {
      constructor(path, base) {
        this.toString = () => `${base}${path}`;
      }
    };
  });

  afterEach(() => {
    // Restore console methods
    if (console.log.mockRestore) console.log.mockRestore();
    if (console.error.mockRestore) console.error.mockRestore();
  });

  afterAll(() => {
    // Restore original global functions
    global.fetch = originalFetch;
    global.URL = originalURL;
  });

  describe('invoke handler', () => {
    test('should successfully revoke user sessions', async () => {
      const params = {
        userKey: 'user@example.com',
        googleDomain: 'example.com'
      };

      const result = await script.invoke(params, mockContext);

      expect(result.userKey).toBe('user@example.com');
      expect(result.sessionRevoked).toBe(true);
      expect(result.googleDomain).toBe('example.com');
      expect(result.revokedAt).toBeDefined();
    });

    test('should throw error for missing userKey', async () => {
      const params = {
        googleDomain: 'example.com'
      };

      await expect(script.invoke(params, mockContext))
        .rejects.toThrow('Invalid or missing userKey parameter');
    });

    test('should throw error for missing googleDomain', async () => {
      const params = {
        userKey: 'user@example.com'
      };

      await expect(script.invoke(params, mockContext))
        .rejects.toThrow('Invalid or missing googleDomain parameter');
    });

    test('should throw error for missing BEARER_AUTH_TOKEN', async () => {
      const params = {
        userKey: 'user@example.com',
        googleDomain: 'example.com'
      };

      const contextWithoutToken = {
        ...mockContext,
        secrets: {}
      };

      await expect(script.invoke(params, contextWithoutToken))
        .rejects.toThrow('Missing required secret: BEARER_AUTH_TOKEN');
    });

    test('should handle API error with error message', async () => {
      const params = {
        userKey: 'user@example.com',
        googleDomain: 'example.com'
      };

      global.fetch = () => Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: 404,
            message: 'User not found',
            status: 'NOT_FOUND'
          }
        })
      });

      const error = await script.invoke(params, mockContext).catch(e => e);
      expect(error.message).toBe('Failed to revoke sessions: User not found');
      expect(error.statusCode).toBe(404);
    });

    test('should handle API error without JSON body', async () => {
      const params = {
        userKey: 'user@example.com',
        googleDomain: 'example.com'
      };

      global.fetch = () => Promise.resolve({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Not JSON');
        }
      });

      const error = await script.invoke(params, mockContext).catch(e => e);
      expect(error.message).toBe('Failed to revoke sessions: HTTP 500');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('error handler', () => {
    test('should re-throw error for framework to handle', async () => {
      const params = {
        userKey: 'user@example.com',
        error: new Error('Network timeout')
      };

      await expect(script.error(params, mockContext))
        .rejects.toThrow('Network timeout');
    });
  });

  describe('halt handler', () => {
    test('should handle graceful shutdown', async () => {
      const params = {
        userKey: 'user@example.com',
        reason: 'timeout'
      };

      const result = await script.halt(params, mockContext);

      expect(result.userKey).toBe('user@example.com');
      expect(result.reason).toBe('timeout');
      expect(result.haltedAt).toBeDefined();
      expect(result.cleanupCompleted).toBe(true);
    });

    test('should handle halt with missing params', async () => {
      const params = {
        reason: 'system_shutdown'
      };

      const result = await script.halt(params, mockContext);

      expect(result.userKey).toBe('unknown');
      expect(result.reason).toBe('system_shutdown');
      expect(result.cleanupCompleted).toBe(true);
    });
  });
});