import React from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Play,
  CheckCircle,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react';
import { createGoogleCalendarUrl } from '../utils/calendarHelper';

export const DailyTaskList = ({
  tasks = [],
  onToggleTask,
  onSelectFocusTask,
  title = "Today's Catch-Up Focus",
  subtitle = "Bite-sized daily targets designed to rebuild your momentum",
}) => {
  const handleCheck = async (planId, taskId, isCurrentComplete) => {
    if (!isCurrentComplete) {
      // Trigger tiny celebratory confetti burst
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#f97316', '#fb923c', '#10b981', '#3b82f6'],
        });
      } catch (e) {}
    }
    await onToggleTask(planId, taskId);
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const isAllComplete = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
            {totalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">
                {completedCount}/{totalCount} Done
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-28 sm:w-36 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
              {Math.round((completedCount / (totalCount || 1)) * 100)}%
            </span>
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No scheduled tasks for today!
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            You're either all caught up or have a rest day. Create a new catch-up plan or take a well-deserved breather!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isDone = task.status === 'completed';
            const priorityColors = {
              high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
              medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
              low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
            };

            return (
              <div
                key={task.id}
                className={`group flex items-start justify-between p-4 rounded-2xl border transition-all duration-200 ${
                  isDone
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-70'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-brand-500/50 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 pr-3">
                  <button
                    type="button"
                    onClick={() => handleCheck(task.planId, task.id, isDone)}
                    className="mt-0.5 text-slate-400 hover:text-brand-500 transition-transform active:scale-90"
                    title={isDone ? 'Mark as pending' : 'Mark as complete'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5 group-hover:stroke-brand-500" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-bold ${
                          isDone
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.planTitle && (
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          {task.planTitle}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {task.estimatedMinutes} mins
                      </span>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          priorityColors[task.priority] || priorityColors.medium
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {!isDone && (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={createGoogleCalendarUrl({
                        title: task.title,
                        description: task.description,
                        dateStr: task.scheduledDate || new Date().toISOString().split('T')[0],
                        durationMinutes: task.estimatedMinutes || 30,
                        subject: task.subject || task.planTitle || 'Study Session',
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all shadow-sm border border-blue-500/20"
                      title="Set reminder in Google Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Remind</span>
                    </a>

                    {onSelectFocusTask && (
                      <button
                        type="button"
                        onClick={() => onSelectFocusTask(task)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 dark:bg-slate-700 dark:hover:bg-brand-950/40 text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 text-xs font-bold transition-all shadow-sm group-hover:scale-105"
                        title="Start Pomodoro focus on this task"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Focus</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isAllComplete && (
        <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-center flex items-center justify-center gap-2 text-sm font-bold animate-bounce-short">
          <Sparkles className="w-4 h-4" />
          <span>All tasks done for today! Your streak is safely guarded!</span>
        </div>
      )}
    </div>
  );
};
