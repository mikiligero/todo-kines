import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth-utils'

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // 1. Decrypt session from new cookie name
    const sessionCookie = request.cookies.get('todo_kines_session')?.value
    const session = sessionCookie ? await decrypt(sessionCookie) : null

    // 2. Redirection logic for authenticated users on /login
    if (pathname === '/login' && session?.userId) {
        console.log('✅ Auth user redirected to home from /login')
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 3. Check for public routes
    const isPublicRoute =
        pathname.startsWith('/login') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.')

    if (isPublicRoute) {
        return NextResponse.next()
    }

    // 4. Protection for everything else
    if (!session?.userId) {
        console.log(`🔒 Unauth redirect from ${pathname} to /login`)
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}


export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
