import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeSession, COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = decodeSession(token);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      personId: session.personId,
      profileRole: session.profileRole || 'user',
      name: session.name,
    },
  });
}
