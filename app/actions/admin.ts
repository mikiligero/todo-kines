'use server'

import prisma from '@/lib/prisma'
import { getSession, hashPassword } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'


export async function getUsers() {
    const session = await getSession()
    if (!session?.userId) return []

    // Ensure admin
    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user?.isAdmin) return []

    return await prisma.user.findMany({
        select: { id: true, username: true, isAdmin: true, createdAt: true }
    })
}

export async function createUser(formData: FormData) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user?.isAdmin) return { error: 'Forbidden' }

    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) return { error: 'All fields required' }

    try {
        await prisma.user.create({
            data: {
                username,
                password: await hashPassword(password),
                isAdmin: false // Default to normal user
            }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to create user (username might be taken)' }
    }
}

export async function updateUser(id: string, formData: FormData) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    // Ensure admin
    const admin = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!admin?.isAdmin) return { error: 'Forbidden' }

    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const isAdmin = formData.get('isAdmin') === 'on'

    try {
        const data: any = {
            username,
            isAdmin
        }

        if (password && password.trim() !== '') {
            data.password = await hashPassword(password)
        }

        await prisma.user.update({
            where: { id },
            data
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to update user' }
    }
}

export async function deleteUser(id: string) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    // Ensure admin
    const admin = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!admin?.isAdmin) return { error: 'Forbidden' }

    if (id === session.userId) {
        return { error: 'Cannot delete yourself' }
    }

    try {
        await prisma.user.delete({ where: { id } })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to delete user' }
    }
}

