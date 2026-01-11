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
                        createdAt: u.createdAt
                    },
                    create: {
                        id: u.id,
                        username: u.username,
                        password: u.password,
                        isAdmin: u.isAdmin,
                        createdAt: u.createdAt
                    }
                })
            }

            // 2. Restore Categories
            for (const c of data.categories) {
                // Category has 'ownerId' which maps to relation 'owner'
                const ownerConnect = c.ownerId ? { connect: { id: c.ownerId } } : undefined

                await tx.category.upsert({
                    where: { id: c.id },
                    update: {
                        name: c.name,
                        color: c.color,
                        owner: ownerConnect
                    },
                    create: {
                        id: c.id,
                        name: c.name,
                        color: c.color,
                        owner: c.ownerId ? { connect: { id: c.ownerId } } : undefined
                    }
                })
            }

            // 3. Restore Tasks & Subtasks
            for (const t of data.tasks) {
                const { subtasks, ...taskData } = t

                // Task has 'creatorId' and 'categoryId' (required)
                const creatorConnect = t.creatorId ? { connect: { id: t.creatorId } } : undefined
                const categoryConnect = t.categoryId ? { connect: { id: t.categoryId } } : undefined

                // Task might have 'assigneeId' (optional)
                const assigneeConnect = t.assigneeId ? { connect: { id: t.assigneeId } } : undefined

                await tx.task.upsert({
                    where: { id: t.id },
                    update: {
                        title: t.title,
                        description: t.description,
                        completed: t.completed,
                        importance: t.importance,
                        dueDate: t.dueDate ? new Date(t.dueDate) : null,
                        category: categoryConnect, // Required
                        creator: creatorConnect, // Required
                        assignee: assigneeConnect, // Optional
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
                        category: t.categoryId ? { connect: { id: t.categoryId } } : undefined,
                        creator: t.creatorId ? { connect: { id: t.creatorId } } : undefined,
                        assignee: t.assigneeId ? { connect: { id: t.assigneeId } } : undefined,
                        isRecurring: t.isRecurring,
                        recurrenceInterval: t.recurrenceInterval,
                        recurrenceWeekDays: t.recurrenceWeekDays,
                        recurrenceDayOfMonth: t.recurrenceDayOfMonth,
                        recurrenceEndDate: t.recurrenceEndDate ? new Date(t.recurrenceEndDate) : null,
                        reminder: t.reminder ? new Date(t.reminder) : null,
                        createdAt: t.createdAt ? new Date(t.createdAt) : undefined
                    }
                })

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
                                task: { connect: { id: t.id } }
                            }
                        })
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
