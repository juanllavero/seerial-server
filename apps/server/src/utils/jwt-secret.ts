/**
 * Returns the JWT secret from the environment.
 * The secret is generated and persisted automatically by ServerConfigService
 * on first startup; it is never stored in source code or .env files.
 *
 * @throws {Error} if the secret has not been loaded into the process environment yet
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not configured. Ensure ServerConfigService has been initialised before calling this function.',
    );
  }
  return secret;
}
