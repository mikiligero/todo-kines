'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ListTodo, CheckCircle2, Users } from 'lucide-react'
import { TaskItem } from '@/components/TaskItem'
import { ActionFab } from '@/components/ActionFab'
import { CategoryHeaderActions } from '@/components/CategoryHeaderActions'
import { ClearCompletedButton } from '@/components/ClearCompletedButton'
import { AutoRefresh } from '@/components/AutoRefresh'
import { SearchInput } from '@/components/SearchInput'

interface CategoryClientProps {
    category: any
    allCategories: any[]
    user: any
    allUsers: any[]
}

export function CategoryClient({ category: initialCategory, allCategories, user, allUsers }: CategoryClientProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const cat = initialCategory as any

    // Filter tasks based on search query
    const filteredTasks = useMemo(() => {
        const tasks = cat.tasks || []
        if (!searchQuery.trim()) return tasks

        const query = searchQuery.toLowerCase()
        return tasks.filter((task: any) => {
            const matchTitle = task.title.toLowerCase().includes(query)
            const matchSubtask = task.subtasks?.some((st: any) => st.title.toLowerCase().includes(query))
            return matchTitle || matchSubtask
        })
    }, [cat.tasks, searchQuery])

    const pendingTasks = filteredTasks.filter((t: any) => !t.completed)
    const completedTasks = filteredTasks.filter((t: any) => t.completed)

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32">
            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-indigo-600 mb-4 transition-colors">
                            <ChevronLeft size={16} />
                            Back to Dashboard
                        </Link>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{cat.name}</h1>
                            </div>
                            {cat.ownerId === user.id && cat.id !== 'shared-virtual' && (
                                <CategoryHeaderActions category={cat} allUsers={allUsers} />
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {cat.owner && cat.ownerId !== 'system' && cat.ownerId !== user.id && (
                                <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 w-fit">
                                    <Users size={14} />
                                    Compartido por @{cat.owner.username}
                                </div>
                            )}
                            {cat.ownerId === user.id && cat.sharedWith && cat.sharedWith.length > 0 && (
                                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 w-fit">
                                    <Users size={14} />
                                    Compartido con {cat.sharedWith.map((u: any) => `@${u.username}`).join(', ')}
                                </div>
                            )}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                            {pendingTasks.length} pending tasks · {completedTasks.length} completed
                        </p>
                    </div>

                    <div className="w-full md:w-auto mt-2 md:mt-0">
                        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search in category..." />
                    </div>
                </div>
            </header>

            <div className="space-y-12">
                {/* Pending Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-white">
                        <ListTodo size={18} className="text-indigo-500" />
                        <h2 className="text-lg font-semibold">{searchQuery ? 'Matching Pending Tasks' : 'Pending'}</h2>
                    </div>

                    <div className="space-y-3">
                        {pendingTasks.length === 0 ? (
                            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500">
                                {searchQuery ? 'No pending tasks match your search.' : 'No pending tasks in this category.'}
                            </div>
                        ) : (
                            pendingTasks.map((task: any) => <TaskItem key={task.id} task={task} categories={allCategories} allUsers={allUsers} currentUserId={user.id} />)
                        )}
                    </div>
                </section>

                {/* Completed Section */}
                {(completedTasks.length > 0) && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                                <CheckCircle2 size={18} className="text-zinc-400" />
                                <h2 className="text-lg font-semibold">{searchQuery ? 'Matching Completed Tasks' : 'Completed'}</h2>
                            </div>
                            {!searchQuery && <ClearCompletedButton categoryId={cat.id} />}
                        </div>
                        <div className="space-y-3 opacity-80">
                            {completedTasks.map((task: any) => <TaskItem key={task.id} task={task} categories={allCategories} allUsers={allUsers} currentUserId={user.id} />)}
                        </div>
                    </section>
                )}
            </div>

            <ActionFab categories={allCategories} />
            <AutoRefresh />
        </div>
    )
}
