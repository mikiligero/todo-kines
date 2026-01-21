import { getSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { getCategories } from '@/app/actions/categories'
import { getPendingTasks } from '@/app/actions/tasks'
import { getUsersForSharing } from '@/app/actions/users'
import { ActionFab } from '@/components/ActionFab'
import prisma from '@/lib/prisma'
import { Sidebar } from '@/components/Sidebar'
import { AutoRefresh } from '@/components/AutoRefresh'
import { DashboardClient } from '@/components/DashboardClient'

async function getUser(userId: string) {
  return await prisma.user.findUnique({ where: { id: userId } })
}

export default async function Home() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const [user, categories, tasks, allUsers] = await Promise.all([
    getUser(session.userId),
    getCategories(),
    getPendingTasks(),
    getUsersForSharing()
  ])

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar user={user} categories={categories} allUsers={allUsers} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <DashboardClient user={user} categories={categories} initialTasks={tasks} allUsers={allUsers} />
      </main>

      <ActionFab categories={categories} />
      <AutoRefresh />
    </div>
  )
}

