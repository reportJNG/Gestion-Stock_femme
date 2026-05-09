export const dynamic = 'force-static';

export async function GET() {
  return new Response('Auth callback - configure .env.local for full functionality', {
    status: 200,
    headers: { 'content-type': 'text/plain' },
  });
}
