'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function exportData() {
    const session = await getSession()
    if (!session?.userId) return { error: 'Unauthorized' }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    // Allow any user to export their own data? 
    // Or only admin to export ALL data?
    // Request said "exportar toda la info (ihcluido usuarios , categorias, tareas)..." -> implies Admin export of system state.

    if (!user?.isAdmin) return { error: 'Forbidden' }

    const [users, categories, tasks] = await Promise.all([
        prisma.user.findMany({
            select: {
                id: true, username: true, isAdmin: true, createdAt: true,
                // Excluding password hash for security, unless they want full restoration backup
                // For now, removing passwords is safer. Backup/Restore usually needs internal DB tools.
                // If this is for "viewing info", no passwords. If for full backup... 
                // Let's exclude passwords for now.
            }
        }),
        prisma.category.findMany(),
        prisma.task.findMany()
    ])

    return {
        timestamp: new Date().toISOString(),
        users,
        categories,
        tasks
    }
}
