import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const SECRET_KEY = process.env.AUTH_SECRET || process.env.JWT_SECRET
if (!SECRET_KEY) {
    console.warn('⚠️ AUTH_SECRET or JWT_SECRET not found in environment variables. Using default key.')
}
const key = new TextEncoder().encode(SECRET_KEY || 'default-secret-key-change-it')

const COOKIE_NAME = 'todo_kines_session'

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
}

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('180d') // 6 months session
        .sign(key)
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        console.error('❌ Failed to decrypt session token:', error instanceof Error ? error.message : error)
        return null
    }
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get(COOKIE_NAME)?.value
    if (!session) return null
    return await decrypt(session)
}

export async function createSession(userId: string) {
    const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 180 days
    const session = await encrypt({ userId, expires })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, session, {
        httpOnly: true,
        // Disable secure in production if we are not using HTTPS (common in local LXC/Proxmox)
        // You can enable it by setting REQUIRE_SECURE_AUTH=true in .env
        secure: process.env.REQUIRE_SECURE_AUTH === 'true',
        expires,
        sameSite: 'lax',
        path: '/',
    })
}

export async function deleteSession() {
    ; (await cookies()).delete(COOKIE_NAME)
}

