import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt';
import { env } from './env';

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
  const session = await getToken({
    req: request,
    secret: env.NEXTAUTH_SECRET,
  })
  if (!session) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
}