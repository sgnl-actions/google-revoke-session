# Google Revoke Session Action

Sign out a Google Workspace user from all web and device sessions. This action is commonly used for security incidents, offboarding users, or forcing re-authentication.

## Overview

This SGNL action integrates with the Google Admin SDK Directory API to revoke all active sessions for a Google Workspace user. When executed, the user will be signed out from all web and device sessions and forced to re-authenticate on their next access attempt.

## Prerequisites

- Google Workspace Admin account
- Appropriate authentication credentials (Bearer token, Basic auth, OAuth2, etc.)
- Admin API access enabled
- User key (email or unique ID) of the user whose sessions should be revoked

## Configuration

### Required Secrets

The configured auth type will determine which secrets are needed:

- **Bearer Authentication**: `BEARER_AUTH_TOKEN`
- **Basic Authentication**: `BASIC_USERNAME` and `BASIC_PASSWORD`
- **OAuth2 Client Credentials**: `OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET`
- **OAuth2 Authorization Code**: `OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN`

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ADDRESS` | `https://admin.googleapis.com` | Google Admin SDK API base URL (can also be provided via `address` parameter) |
| `OAUTH2_CLIENT_CREDENTIALS_AUDIENCE` | - | OAuth2 audience for client credentials flow |
| `OAUTH2_CLIENT_CREDENTIALS_AUTH_STYLE` | - | OAuth2 auth style (InParams or InHeader) |
| `OAUTH2_CLIENT_CREDENTIALS_CLIENT_ID` | - | OAuth2 client ID |
| `OAUTH2_CLIENT_CREDENTIALS_SCOPE` | - | OAuth2 scope |
| `OAUTH2_CLIENT_CREDENTIALS_TOKEN_URL` | - | OAuth2 token endpoint URL |

### Input Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `userKey` | string | Yes | The user's primary email, alias, or unique user ID | `user@example.com` |
| `address` | string | No | Google Admin SDK API base URL (defaults to `https://admin.googleapis.com`) | `https://admin.googleapis.com` |

### Output Structure

| Field | Type | Description |
|-------|------|-------------|
| `userKey` | string | The user key that was signed out |
| `sessionRevoked` | boolean | Whether the session was successfully revoked |
| `revokedAt` | datetime | When the session was revoked (ISO 8601) |

## Usage Example

### Job Request

```json
{
  "id": "revoke-session-001",
  "type": "nodejs-22",
  "script": {
    "repository": "github.com/sgnl-actions/google-revoke-session",
    "version": "v1.0.0",
    "type": "nodejs"
  },
  "script_inputs": {
    "userKey": "user@example.com",
    "address": "https://admin.googleapis.com"
  },
  "environment": {
    "LOG_LEVEL": "info"
  }
}
```

### Successful Response

```json
{
  "userKey": "user@example.com",
  "sessionRevoked": true,
  "revokedAt": "2024-01-15T10:30:00Z"
}
```

## Authentication Methods

This action supports multiple authentication methods via the `@sgnl-actions/utils` package:

### 1. Bearer Token
Simple bearer token authentication:
```json
"secrets": {
  "BEARER_AUTH_TOKEN": "your-bearer-token"
}
```

### 2. Basic Authentication
Username and password authentication:
```json
"secrets": {
  "BASIC_USERNAME": "your-username",
  "BASIC_PASSWORD": "your-password"
}
```

### 3. OAuth2 Client Credentials
Machine-to-machine OAuth2 flow (fetches token dynamically):
```json
"secrets": {
  "OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET": "your-client-secret"
},
"environment": {
  "OAUTH2_CLIENT_CREDENTIALS_CLIENT_ID": "your-client-id",
  "OAUTH2_CLIENT_CREDENTIALS_TOKEN_URL": "https://oauth2.googleapis.com/token",
  "OAUTH2_CLIENT_CREDENTIALS_SCOPE": "https://www.googleapis.com/auth/admin.directory.user.security"
}
```

### 4. OAuth2 Authorization Code
Uses pre-existing access token (no refresh, uses as-is):
```json
"secrets": {
  "OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN": "your-access-token"
}
```

## Error Handling

The action includes comprehensive error handling:

### Successful Cases
- **204 No Content**: Sessions successfully revoked

### Error Cases
- **401 Unauthorized**: Invalid or expired authentication credentials
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: User not found
- **Other errors**: Thrown with detailed error messages

## Development

### Local Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Test locally with mock data
npm run dev

# Build for production
npm run build
```

### Running Tests

The action includes comprehensive unit tests covering:
- Input validation (userKey)
- Successful session revocation
- Address parameter handling (default, parameter, environment variable)
- Error handling

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Check test coverage
npm run test:coverage
```

## Security Considerations

- **Token Protection**: Never log or expose authentication tokens
- **Audit Logging**: All session revocations are logged with timestamps
- **Input Validation**: User key is validated before API calls
- **Forced Re-authentication**: Users must re-authenticate after session revocation

## Google Admin SDK API Reference

This action uses the following Google Admin SDK API endpoint:
- [Sign Out User](https://developers.google.com/admin-sdk/directory/reference/rest/v1/users/signOut)

## Troubleshooting

### Common Issues

1. **"Invalid or missing userKey parameter"**
   - Ensure the `userKey` parameter is provided and is a non-empty string
   - The userKey can be the user's primary email, alias, or unique user ID

2. **Authentication Errors (401)**
   - Verify your authentication credentials are valid and haven't expired
   - For OAuth2, ensure the access token has the correct scopes (`admin.directory.user.security`)

3. **Permission Errors (403)**
   - Ensure your credentials have the required permissions to sign out users
   - Verify the service account or OAuth client has Admin SDK access

4. **User Not Found (404)**
   - Verify the userKey is correct
   - Check that the user exists in your Google Workspace domain

## Version History

### v1.0.0
- Initial release
- Support for session revocation via Google Admin SDK API
- Multiple authentication methods (Bearer, Basic, OAuth2 Client Credentials, OAuth2 Authorization Code)
- Integration with @sgnl-actions/utils package
- Comprehensive error handling

## License

MIT

## Support

For issues or questions, please contact SGNL Engineering or create an issue in this repository.
