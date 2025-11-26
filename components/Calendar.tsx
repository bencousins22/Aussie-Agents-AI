
import React from 'react';
import { ScheduledTask } from '../types';

interface CalendarProps {
    tasks: ScheduledTask[];
}

export const Calendar: React.FC<CalendarProps> = ({ tasks }) => {
    // A simple list view of upcoming tasks, for now.
    // This can be expanded into a full grid-based calendar view in the future.
    const upcomingTasks = tasks
        .filter(t => t.status === 'active')
        .sort((a, b) => a.nextRun - b.nextRun);

    return (
        <div className="p-4 bg-[#1c2128] border border-gray-700 rounded-xl">
            <h3 className="font-bold text-white mb-4">Upcoming Scheduled Tasks</h3>
            {upcomingTasks.length > 0 ? (
                <ul className="space-y-3">
                    {upcomingTasks.map(task => (
                        <li key={task.id} className="p-3 bg-[#0d1117] rounded-lg border border-gray-800">
                            <p className="font-semibold text-white">{task.name}</p>
                            <p className="text-sm text-gray-400">
                                Scheduled for: {new Date(task.nextRun).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                                Frequency: {task.schedule}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">No upcoming tasks are scheduled.</p>
            )}
        </div>
    );
};
