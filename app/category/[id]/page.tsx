import { getSession } from '@/lib/auth-utils'
import { redirect, notFound } from 'next/navigation'
import { getCategoryWithTasks, getCategories } from '@/app/actions/categories'
import { getSharedTasks } from '@/app/actions/tasks'
import { getUsersForSharing } from '@/app/actions/users'
import { Sidebar } from '@/components/Sidebar'
import { CategoryClient } from '@/components/CategoryClient'
import prisma from '@/lib/prisma'

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getSession()
    if (!session?.userId) redirect('/login')

    const [category, allCategories, user, allUsers] = await Promise.all([
        id === 'shared-virtual' ? getSharedTasks() : getCategoryWithTasks(id),
        getCategories(),
        prisma.user.findUnique({ where: { id: session.userId } }),
        getUsersForSharing()
    ])

    if (!category || !user) notFound()

    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
            <Sidebar user={user} categories={allCategories} allUsers={allUsers} />

            <main className="flex-1 overflow-auto">
                <CategoryClient category={category} allCategories={allCategories} user={user} allUsers={allUsers} />
            </main>
        </div>
    )
}

