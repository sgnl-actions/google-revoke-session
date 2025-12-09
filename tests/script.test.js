import script from '../src/script.mjs';

describe('Google Revoke Session Script', () => {
  const mockContext = {
    environment: {
      ADDRESS: 'https://admin.googleapis.com'
    },
    secrets: {
      OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN: 'test-google-access-token'
    },
    outputs: {}
  };

  let originalFetch;

  beforeAll(() => {
    // Save original fetch
    originalFetch = global.fetch;
  });

  beforeEach(() => {
    // Mock console to avoid noise in tests
    global.console.log = () => {};
    global.console.error = () => {};

    // Mock fetch
    global.fetch = () => Promise.resolve({
      ok: true,
      status: 204
    });
  });

  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('invoke handler', () => {
    test('should successfully revoke user sessions', async () => {
      const params = {
        userKey: 'user@example.com'
      };

      const result = await script.invoke(params, mockContext);

      expect(result.userKey).toBe('user@example.com');
      expect(result.sessionRevoked).toBe(true);
      expect(result.revokedAt).toBeDefined();
    });

    test('should throw error for missing userKey', async () => {
      const params = {};

      await expect(script.invoke(params, mockContext))
        .rejects.toThrow('Invalid or missing userKey parameter');
    });

    test('should use default Google Admin SDK URL when address not provided', async () => {
      const params = {
        userKey: 'user@example.com'
      };

      let capturedUrl;
      global.fetch = async (url, options) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 204
        };
      };

      await script.invoke(params, mockContext);

      expect(capturedUrl).toBe('https://admin.googleapis.com/admin/directory/v1/users/user%40example.com/signOut');
    });

    test('should use address parameter when provided', async () => {
      const params = {
        userKey: 'user@example.com',
        address: 'https://custom.googleapis.com'
      };

      let capturedUrl;
      global.fetch = async (url, options) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 204
        };
      };

      await script.invoke(params, mockContext);

      expect(capturedUrl).toBe('https://custom.googleapis.com/admin/directory/v1/users/user%40example.com/signOut');
    });

    test('should use ADDRESS environment variable when address param not provided', async () => {
      const params = {
        userKey: 'user@example.com'
      };

      const contextWithEnvAddress = {
        ...mockContext,
        environment: {
          ADDRESS: 'https://env.googleapis.com'
        }
      };

      let capturedUrl;
      global.fetch = async (url, options) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 204
        };
      };

      await script.invoke(params, contextWithEnvAddress);

      expect(capturedUrl).toBe('https://env.googleapis.com/admin/directory/v1/users/user%40example.com/signOut');
    });

    test('should handle API error with error message', async () => {
      const params = {
        userKey: 'user@example.com'
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
        userKey: 'user@example.com'
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