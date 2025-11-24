/**
 * Google Revoke Session Action
 *
 * Signs out a Google Workspace user from all web and device sessions using
 * the Google Admin SDK Directory API.
 */

/**
 * Helper function to revoke user sessions
 * @private
 */
async function revokeUserSessions(userKey, googleDomain, accessToken) {
  // Encode the userKey to handle special characters in email addresses
  const encodedUserKey = encodeURIComponent(userKey);
  const url = new URL(
    `/admin/directory/v1/users/${encodedUserKey}/signOut`,
    'https://admin.googleapis.com'
  );

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  return response;
}


export default {
  /**
   * Main execution handler - revokes all sessions for a Google Workspace user
   * @param {Object} params - Job input parameters
   * @param {string} params.userKey - User's primary email, alias, or unique ID
   * @param {string} params.googleDomain - The Google Workspace domain
   *
   * @param {Object} context - Execution context with secrets and environment
   *
   * The configured auth type will determine which of the following environment variables and secrets are available
   * @param {string} context.secrets.BEARER_AUTH_TOKEN
   *
   * @param {string} context.secrets.BASIC_USERNAME
   * @param {string} context.secrets.BASIC_PASSWORD
   *
   * @param {string} context.secrets.OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET
   * @param {string} context.environment.OAUTH2_CLIENT_CREDENTIALS_AUDIENCE
   * @param {string} context.environment.OAUTH2_CLIENT_CREDENTIALS_AUTH_STYLE
   * @param {string} context.environment.OAUTH2_CLIENT_CREDENTIALS_CLIENT_ID
   * @param {string} context.environment.OAUTH2_CLIENT_CREDENTIALS_SCOPE
   * @param {string} context.environment.OAUTH2_CLIENT_CREDENTIALS_TOKEN_URL
   *
   * @param {string} context.secrets.OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN
   * @param {string} context.secrets.OAUTH2_AUTHORIZATION_CODE_AUTHORIZATION_CODE
   * @param {string} context.secrets.OAUTH2_AUTHORIZATION_CODE_CLIENT_SECRET
   * @param {string} context.secrets.OAUTH2_AUTHORIZATION_CODE_REFRESH_TOKEN
   * @param {string} context.environment.OAUTH2_AUTHORIZATION_CODE_AUTH_STYLE
   * @param {string} context.environment.OAUTH2_AUTHORIZATION_CODE_AUTH_URL
   * @param {string} context.environment.OAUTH2_AUTHORIZATION_CODE_CLIENT_ID
   * @param {string} context.environment.OAUTH2_AUTHORIZATION_CODE_LAST_TOKEN_ROTATION_TIMESTAMP
   * @param {string} context.environment.OAUTH2_AUTHORIZATION_CODE_REDIRECT_URI
   * @param {string} context.environment.OAUTH2_AUTHORIZATION_CODE_SCOPE
   * @param {string} context.environment.OAUTH2_AUTHORIZATION_CODE_TOKEN_LIFETIME_FREQUENCY
   * @param {string} context.environment.OAUTH2_AUTHORIZATION_CODE_TOKEN_ROTATION_FREQUENCY
   * @param {string} context.environment.OAUTH2_AUTHORIZATION_CODE_TOKEN_ROTATION_INTERVAL
   * @param {string} context.environment.OAUTH2_AUTHORIZATION_CODE_TOKEN_URL
   *
   * @returns {Object} Job results
   */
  invoke: async (params, context) => {
    const { userKey, googleDomain } = params;

    console.log(`Starting Google session revocation for user ${userKey}`);

    // Validate inputs
    if (!userKey || typeof userKey !== 'string') {
      throw new Error('Invalid or missing userKey parameter');
    }
    if (!googleDomain || typeof googleDomain !== 'string') {
      throw new Error('Invalid or missing googleDomain parameter');
    }

    // Validate Google access token is present
    if (!context.secrets?.BEARER_AUTH_TOKEN) {
      throw new Error('Missing required secret: BEARER_AUTH_TOKEN');
    }

    // Make the API request to sign out the user
    const response = await revokeUserSessions(
      userKey,
      googleDomain,
      context.secrets.BEARER_AUTH_TOKEN
    );

    // Handle the response
    if (response.ok) {
      // 204 No Content is the expected success response
      console.log(`Successfully revoked sessions for user ${userKey}`);

      return {
        userKey: userKey,
        sessionRevoked: true,
        googleDomain: googleDomain,
        revokedAt: new Date().toISOString()
      };
    }

    // Handle error responses
    const statusCode = response.status;
    let errorMessage = `Failed to revoke sessions: HTTP ${statusCode}`;

    try {
      const errorBody = await response.json();
      if (errorBody.error?.message) {
        errorMessage = `Failed to revoke sessions: ${errorBody.error.message}`;
      }
      console.error('Google API error response:', errorBody);
    } catch {
      // Response might not be JSON
      console.error('Failed to parse error response');
    }

    // Throw error with status code for proper error handling
    const error = new Error(errorMessage);
    error.statusCode = statusCode;
    throw error;
  },

  /**
   * Error recovery handler - framework handles retries by default
   * @param {Object} params - Original params plus error information
   * @param {Object} context - Execution context
   * @returns {Object} Recovery results
   */
  error: async (params, _context) => {
    const { error, userKey } = params;
    console.error(`Session revocation failed for user ${userKey}: ${error.message}`);

    // Framework handles retries for transient errors (429, 502, 503, 504)
    // Just re-throw the error to let the framework handle it
    throw error;
  },

  /**
   * Graceful shutdown handler - cleanup when job is halted
   * @param {Object} params - Original params plus halt reason
   * @param {Object} context - Execution context
   * @returns {Object} Cleanup results
   */
  halt: async (params, _context) => {
    const { reason, userKey } = params;
    console.log(`Session revocation job is being halted (${reason}) for user ${userKey}`);

    // No cleanup needed for this simple operation
    // The POST request either completed or didn't

    return {
      userKey: userKey || 'unknown',
      reason: reason,
      haltedAt: new Date().toISOString(),
      cleanupCompleted: true
    };
  }
};