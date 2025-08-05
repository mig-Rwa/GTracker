// /api/bookings  (non-dynamic)
// No imports needed — use Web Fetch API types

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100';

export async function GET(_request: Request) {
  const upstream = await fetch(`${API_BASE_URL}/api/bookings`, {
    method: 'GET',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  const upstream = await fetch(`${API_BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: request.headers.get('cookie') || '',
      authorization: request.headers.get('authorization') || '',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}
