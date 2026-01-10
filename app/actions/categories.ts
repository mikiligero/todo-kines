'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'


export async function getCategories() {
    const session = await getSession()
    if (!session?.userId) return []

    return await prisma.category.findMany({
        where: {
            OR: [
                { ownerId: session.userId },
                { sharedWith: { some: { id: session.userId } } }
            ]
        },
        include: {
            _count: {
                select: { tasks: { where: { completed: false } } }
            },
            sharedWith: {
                select: { id: true, username: true }
            },
            owner: {
                select: { username: true }
            }
        }
    })
}

export async function createCategory(formData: FormData) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const color = formData.get('color') as string

    if (!name) return { error: 'Name is required' }

    try {
        await prisma.category.create({
            data: {
                name,
                color: color || '#6366f1', // Default Indigo
                ownerId: session.userId,
            }
        })
        revalidatePath('/')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to create category' }
    }
}

export async function updateCategory(id: string, formData: FormData) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const color = formData.get('color') as string
    const sharedWithIdsJson = formData.get('sharedWithIds') as string

    let sharedWithIds: string[] = []
    try {
        sharedWithIds = sharedWithIdsJson ? JSON.parse(sharedWithIdsJson) : []
    } catch (e) {
        // invalid json
    }

    try {
        await prisma.category.update({
            where: {
                id,
                ownerId: session.userId // Only owner can update
            },
            data: {
                name,
                color,
                sharedWith: {
                    set: sharedWithIds.map((uid: string) => ({ id: uid }))
                }
            }
        })
        revalidatePath('/')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to update category' }
    }
}

export async function deleteCategory(id: string) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    try {
        // Only owner can delete
        await prisma.category.delete({
            where: {
                id,
                ownerId: session.userId
            }
        })
        revalidatePath('/')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to delete category' }
    }
}

export async function getCategoryWithTasks(id: string) {
    const session = await getSession()
    if (!session?.userId) return null

    return await prisma.category.findUnique({
        where: {
            id,
            OR: [
                { ownerId: session.userId },
                { sharedWith: { some: { id: session.userId } } }
            ]
        },
        include: {
            owner: {
                select: { username: true }
            },
            sharedWith: {
                select: { id: true, username: true }
            },
            tasks: {
                include: {
                    subtasks: {
                        orderBy: { createdAt: 'asc' }
                    },
                    category: true,
                    creator: {
                        select: { username: true }
                    },
                    sharedWith: {
                        select: { id: true, username: true }
                    }
                },
                orderBy: [
                    { completed: 'asc' },
                    { dueDate: 'asc' }
                ]
            }
        }
    })
}
