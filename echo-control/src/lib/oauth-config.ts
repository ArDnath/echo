/**
 * OAuth configuration utilities
 */

/**
 * Get the refresh token expiry duration in seconds from environment variable
 * Checks OAUTH_REFRESH_TOKEN_EXPIRY_SECONDS first, then OAUTH_REFRESH_TOKEN_EXPIRY_DAYS
 * Defaults to 30 days (2592000 seconds) if neither is set
 */
export function getEchoRefreshTokenExpirySeconds(): number {
  // Check for seconds first (more granular control, useful for testing)
  const secondsEnv = process.env.OAUTH_REFRESH_TOKEN_EXPIRY_SECONDS;
  console.log('🔄 DEBUG: Refresh token expiry seconds: ', secondsEnv);
  if (secondsEnv) {
    const parsed = parseInt(secondsEnv, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    console.warn(
      `Invalid OAUTH_REFRESH_TOKEN_EXPIRY_SECONDS value: ${secondsEnv}. Falling back to days or default.`
    );
  }
  // Default to 1 second
  return 1;
}

/**
 * Create a new Date object for refresh token expiry
 */
export function createEchoRefreshTokenExpiry(): Date {
  const expiry = new Date();
  const expirySeconds = getEchoRefreshTokenExpirySeconds();
  expiry.setTime(expiry.getTime() + expirySeconds * 1000); // multiply by 1000 to convert to milliseconds
  console.log(
    '🔄 DEBUG: Echo Refresh token will expire at ',
    expiry.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  return expiry;
}

export function getEchoAccessTokenExpirySeconds(): number {
  const secondsEnv = process.env.OAUTH_ACCESS_TOKEN_EXPIRY_SECONDS;
  console.log('🔄 DEBUG: Access token expiry seconds: ', secondsEnv);
  if (secondsEnv) {
    const parsed = parseInt(secondsEnv, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1; // Default to 1 second
}

export function createEchoAccessTokenExpiry(): Date {
  const expiry = new Date();
  const expirySeconds = getEchoAccessTokenExpirySeconds();
  expiry.setTime(expiry.getTime() + expirySeconds * 1000);
  console.log(
    '🔄 DEBUG: Echo Access token will expire at ',
    expiry.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  return expiry;
}

/**
 * Get the grace period (in milliseconds) allowed for refreshing using an archived
 * refresh token. This enables a short overlap window during token rotation.
 *
 * Priority:
 * - OAUTH_REFRESH_TOKEN_ARCHIVE_GRACE_MS (milliseconds)
 * - OAUTH_REFRESH_TOKEN_ARCHIVE_GRACE_SECONDS (seconds)
 * - Default: 2 minutes in normal environments, 0 in test mode
 */
export function getArchivedRefreshTokenGraceMs(): number {
  const msEnv = process.env.OAUTH_REFRESH_TOKEN_ARCHIVE_GRACE_MS;
  if (msEnv) {
    const parsedMs = parseInt(msEnv, 10);
    if (!isNaN(parsedMs) && parsedMs >= 0) {
      return parsedMs;
    }
    console.warn(
      `Invalid OAUTH_REFRESH_TOKEN_ARCHIVE_GRACE_MS value: ${msEnv}. Falling back to default.`
    );
  }

  // Default behavior: zero grace in local/integration tests, 2 minutes otherwise
  const isTestMode =
    process.env.INTEGRATION_TEST_MODE === 'true' ||
    process.env.NODE_ENV === 'test';
  return isTestMode ? 0 : 2 * 60 * 1000;
}
