export const SITE_NAME = 'niksyskills';
export const SITE_TAGLINE = 'Agent skills you can install with one command.';

/** Origin for absolute URLs in generated text. Set NEXT_PUBLIC_SITE_URL in production. */
export function siteOrigin(request?: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  if (request) {
    const url = new URL(request.url);
    const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host;
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}
