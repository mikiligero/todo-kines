'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export async function createSubTask(taskId: string, title: string) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    try {
        const subtask = await prisma.subTask.create({
            data: {
                title,
                taskId
            }
        })
        revalidatePath('/')
        return { success: true, subtask }
    } catch (e) {
        return { error: 'Failed to create subtask' }
    }
}

export async function updateSubTask(id: string, formData: FormData) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!title) return { error: 'Title required' }

    try {
        await prisma.subTask.update({
            where: { id },
            data: {
                title,
                description
            }
        })
        revalidatePath('/')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to update subtask' }
    }
}

export async function toggleSubTask(id: string, completed: boolean) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    try {
        await prisma.subTask.update({
            where: { id },
            data: { completed }
        })
        revalidatePath('/')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to update subtask' }
    }
}

export async function deleteSubTask(id: string) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    try {
        await prisma.subTask.delete({
            where: { id }
        })
        revalidatePath('/')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to delete subtask' }
    }
}
