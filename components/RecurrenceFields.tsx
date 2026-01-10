'use client'

import { useState } from 'react'

export function RecurrenceFields({
    initialIsRecurring = false,
    initialInterval = 'daily',
    initialWeekDays = [],
    initialDayOfMonth = null,
    initialEndDate = null
}: {
    initialIsRecurring?: boolean
    initialInterval?: string
    initialWeekDays?: string[]
    initialDayOfMonth?: number | null
    initialEndDate?: string | null
}) {
    const [isRecurring, setIsRecurring] = useState(initialIsRecurring)
    const [interval, setInterval] = useState(initialInterval || 'daily')
    const [selectedDays, setSelectedDays] = useState<string[]>(initialWeekDays || [])

    const weekDays = [
        { id: '1', label: 'Mo' },
        { id: '2', label: 'Tu' },
        { id: '3', label: 'We' },
        { id: '4', label: 'Th' },
        { id: '5', label: 'Fr' },
        { id: '6', label: 'Sa' },
        { id: '0', label: 'Su' },
    ]

    const toggleDay = (id: string) => {
        if (selectedDays.includes(id)) {
            setSelectedDays(selectedDays.filter(d => d !== id))
        } else {
            setSelectedDays([...selectedDays, id])
        }
    }

    return (
        <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isRecurring"
                    name="isRecurring"
                    checked={isRecurring}
                    className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Repeat Task
                </label>
            </div>

            {isRecurring && (
                <div className="space-y-3 pl-6 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Frequency</label>
                            <select
                                name="recurrenceInterval"
                                value={interval}
                                onChange={(e) => setInterval(e.target.value)}
                                className="w-full text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">End Date (Optional)</label>
                            <input
                                type="date"
                                name="recurrenceEndDate"
                                defaultValue={initialEndDate || ''}
                                className="w-full text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5"
                            />
                        </div>
                    </div>

                    {interval === 'weekly' && (
                        <div>
                            <label className="block text-xs text-zinc-500 mb-2">Repeat on</label>
                            <div className="flex gap-1 justify-between">
                                {weekDays.map(day => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => toggleDay(day.id)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${selectedDays.includes(day.id)
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" name="recurrenceWeekDays" value={selectedDays.join(',')} />
                        </div>
                    )}

                    {interval === 'monthly' && (
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Day of Month</label>
                            <input
                                type="number"
                                name="recurrenceDayOfMonth"
                                min="1"
                                max="31"
                                placeholder="e.g. 15"
                                defaultValue={initialDayOfMonth || ''}
                                className="w-full text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
