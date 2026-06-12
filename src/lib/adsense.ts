/**
 * Checks if AdSense should be enabled based on the current environment.
 * AdSense is only loaded in production and never on localhost to prevent
 * invalid traffic and development console noise.
 */
export function isAdSenseEnabled(): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  return !['localhost', '127.0.0.1', '::1'].includes(hostname);
}
