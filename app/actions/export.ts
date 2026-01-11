'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function exportData() {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user?.isAdmin) return { error: 'Forbidden' }

    const [users, categories, tasks] = await Promise.all([
        prisma.user.findMany({
            // Include password for restoration purposes
            select: {
                id: true, username: true, password: true, isAdmin: true, createdAt: true
            }
        }),
        prisma.category.findMany(),
        prisma.task.findMany({
            include: {
                subtasks: true
            }
        })
    ])

    return {
        version: 1,
        timestamp: new Date().toISOString(),
        users,
        categories,
        tasks
    }
}

export async function importData(jsonData: string) {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!currentUser?.isAdmin) return { error: 'Forbidden' }

    try {
        const data = JSON.parse(jsonData)

        // Basic validation
        if (!data.users || !data.categories || !data.tasks) {
            return { error: 'Invalid backup file format' }
        }

        // We use a transaction to ensure integrity
        await prisma.$transaction(async (tx) => {
            // 1. Restore Users
            for (const u of data.users) {
                await tx.user.upsert({
                    where: { id: u.id },
                    update: {
                        username: u.username,
                        password: u.password,
                        isAdmin: u.isAdmin,
                        createdAt: new Date(u.createdAt)
                    },
                    create: {
                        id: u.id,
                        username: u.username,
                        password: u.password,
                        isAdmin: u.isAdmin,
                        createdAt: new Date(u.createdAt)
                    }
                })
            }

            // 2. Restore Categories
            for (const c of data.categories) {
                await tx.category.upsert({
                    where: { id: c.id },
                    update: {
                        name: c.name,
                        color: c.color,
                        ownerId: c.ownerId
                    },
                    create: {
                        id: c.id,
                        name: c.name,
                        color: c.color,
                        ownerId: c.ownerId
                    }
                } as any) // Type cast to avoid strict relation requirements during build
            }

            // 3. Restore Tasks & Subtasks
            for (const t of data.tasks) {
                const { subtasks, ...taskData } = t

                await tx.task.upsert({
                    where: { id: t.id },
                    update: {
                        title: t.title,
                        description: t.description,
                        completed: t.completed,
                        importance: t.importance,
                        dueDate: t.dueDate ? new Date(t.dueDate) : null,
                        categoryId: t.categoryId,
                        creatorId: t.creatorId,
                        assigneeId: t.assigneeId,
                        isRecurring: t.isRecurring,
                        recurrenceInterval: t.recurrenceInterval,
                        recurrenceWeekDays: t.recurrenceWeekDays,
                        recurrenceDayOfMonth: t.recurrenceDayOfMonth,
                        recurrenceEndDate: t.recurrenceEndDate ? new Date(t.recurrenceEndDate) : null,
                        reminder: t.reminder ? new Date(t.reminder) : null,
                        createdAt: t.createdAt ? new Date(t.createdAt) : undefined
                    },
                    create: {
                        id: t.id,
                        title: t.title,
                        description: t.description,
                        completed: t.completed,
                        importance: t.importance,
                        dueDate: t.dueDate ? new Date(t.dueDate) : null,
                        categoryId: t.categoryId,
                        creatorId: t.creatorId,
                        assigneeId: t.assigneeId,
                        isRecurring: t.isRecurring,
                        recurrenceInterval: t.recurrenceInterval,
                        recurrenceWeekDays: t.recurrenceWeekDays,
                        recurrenceDayOfMonth: t.recurrenceDayOfMonth,
                        recurrenceEndDate: t.recurrenceEndDate ? new Date(t.recurrenceEndDate) : null,
                        reminder: t.reminder ? new Date(t.reminder) : null,
                        createdAt: t.createdAt ? new Date(t.createdAt) : undefined
                    }
                } as any)

                if (subtasks && Array.isArray(subtasks)) {
                    for (const st of subtasks) {
                        await tx.subTask.upsert({
                            where: { id: st.id },
                            update: {
                                title: st.title,
                                completed: st.completed
                            },
                            create: {
                                id: st.id,
                                title: st.title,
                                completed: st.completed,
                                taskId: t.id
                            }
                        } as any)
                    }
                }
            }
        })

        return { success: true }
    } catch (e) {
        console.error('Import error:', e)
        return { error: 'Failed to import data: ' + (e as Error).message }
    }
}
