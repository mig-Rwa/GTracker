const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100';

export async function PUT(request: Request, { params }: any) {
  const body = await request.json();

  const upstream = await fetch(`${API_BASE_URL}/api/bookings/${params.id}`, {
    method: 'PUT',
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

export async function DELETE(request: Request, { params }: any) {
  const upstream = await fetch(`${API_BASE_URL}/api/bookings/${params.id}`, {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      cookie: request.headers.get('cookie') || '',
      authorization: request.headers.get('authorization') || '',
    },
    credentials: 'include',
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}
