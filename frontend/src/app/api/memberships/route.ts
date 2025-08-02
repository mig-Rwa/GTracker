import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/memberships`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch memberships' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Forward the incoming body to the backend unchanged
    const body = await request.text();

    const response = await fetch(`${API_BASE_URL}/api/memberships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies / auth headers if present so backend can verify JWT
        'Cookie': request.headers.get('cookie') || '',
        // Forward the Authorization header if the frontend sent it explicitly
        'Authorization': request.headers.get('authorization') || '',
      },
      body,
      credentials: 'include',
    });

    // Some successful responses have empty bodies (skipStripe dev mode)
    const rawText = await response.text();
    let data: any = null;
    try {
      if (rawText) data = JSON.parse(rawText);
    } catch (_) {
      /* ignore non-JSON */
    }

    if (response.ok) {
      return NextResponse.json(data ?? { success: true });
    } else {
      return NextResponse.json(
        { error: (data && data.message) || rawText || 'Failed to create membership' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error creating membership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/memberships`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
      },
      credentials: 'include',
    });

    const rawText = await response.text();
    let data: any = null;
    try {
      if (rawText) data = JSON.parse(rawText);
    } catch (_) {/* ignore */}

    if (response.ok) {
      return NextResponse.json(data ?? { success: true });
    } else {
      return NextResponse.json(
        { error: (data && data.message) || rawText || 'Failed to cancel membership' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error cancelling membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}