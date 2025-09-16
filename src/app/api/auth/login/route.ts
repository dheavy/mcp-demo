import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const result = await loginUser(username, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Set HTTP-only cookie.
    const response = NextResponse.json({
      message: 'Login successful',
      user: result.user,
    });

    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
