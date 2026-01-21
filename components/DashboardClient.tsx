'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { TaskItem } from '@/components/TaskItem'
import { CategoryCard } from '@/components/CategoryCard'
import { SearchInput } from '@/components/SearchInput'

interface DashboardClientProps {
    user: any
    categories: any[]
    initialTasks: any[]
    allUsers: any[]
}

export function DashboardClient({ user, categories, initialTasks, allUsers }: DashboardClientProps) {
    const [searchQuery, setSearchQuery] = useState('')

    // Filter tasks based on search query
    const tasks = useMemo(() => {
        if (!searchQuery.trim()) return initialTasks

        const query = searchQuery.toLowerCase()
        return initialTasks.filter(task => {
            const matchTitle = task.title.toLowerCase().includes(query)
            const matchSubtask = task.subtasks?.some((st: any) => st.title.toLowerCase().includes(query))
            return matchTitle || matchSubtask
        })
    }, [initialTasks, searchQuery])

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32">
            <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Good Morning, {user.username}!</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        You have <span className="font-semibold text-indigo-600 dark:text-indigo-400">{tasks.length}</span> pending tasks {searchQuery ? 'matching your search' : 'today'}.
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search tasks..." />

                    {user.isAdmin && (
                        <Link
                            href="/admin"
                            className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-indigo-500 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 transition-all flex items-center gap-2 px-4 shrink-0"
                            title="Configuration / Admin"
                        >
                            <Settings size={18} />
                            <span className="text-sm font-medium hidden sm:inline">Config</span>
                        </Link>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Pending Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                            {searchQuery ? 'Search Results' : 'Pending Tasks'}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {tasks.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
                                <p className="text-zinc-500">
                                    {searchQuery ? 'No tasks found matching your search.' : 'No pending tasks. Enjoy your day!'}
                                </p>
                            </div>
                        ) : (
                            tasks.map((task: any) => (
                                <TaskItem key={task.id} task={task} categories={categories} allUsers={allUsers} currentUserId={user.id} />
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Categories Summary */}
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Overview</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Virtual Shared Category */}
                        {initialTasks.some((t: any) => t.creatorId !== user.id) && (
                            <CategoryCard
                                cat={{
                                    id: 'shared-virtual',
                                    name: 'Shared with me',
                                    color: '#6366f1', // Indigo-500
                                    ownerId: 'system',
                                    _count: { tasks: initialTasks.filter((t: any) => t.creatorId !== user.id).length },
                                    tasks: initialTasks.filter((t: any) => t.creatorId !== user.id)
                                } as any}
                                allCategories={categories}
                                currentUserId={user.id}
                            />
                        )}

                        {categories.map(cat => (
                            <CategoryCard key={cat.id} cat={cat} allCategories={categories} currentUserId={user.id} />
                        ))}
                        {categories.length === 0 && (
                            <div className="col-span-2 text-sm text-zinc-500 text-center py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                                No categories yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
