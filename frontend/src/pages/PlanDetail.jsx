import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RescueModal } from '../components/RescueModal';
import { DeletePlanModal } from '../components/DeletePlanModal';
import { GoogleCalendarModal } from '../components/GoogleCalendarModal';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { createGoogleCalendarUrl } from '../utils/calendarHelper';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  LifeBuoy,
  Play,
  Trash2,
  Plus,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  History,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';

export const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [plan, setPlan] = useState(null);
  const [groupedByDate, setGroupedByDate] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Timers
  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedTaskForCalendar, setSelectedTaskForCalendar] = useState(null);
  const [activeFocusTask, setActiveFocusTask] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Add micro-task state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(30);
  const [selectedDateForNewTask, setSelectedDateForNewTask] = useState('');

  const fetchPlan = async () => {
    try {
      const res = await api.getPlanById(id);
      if (res.success) {
        setPlan(res.plan);
        setGroupedByDate(res.groupedByDate);
        setAnalytics(res.analytics);
      }
    } catch (err) {
      setError('Failed to fetch plan details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const handleToggleTask = async (taskId) => {
    try {
      const res = await api.toggleTask(id, taskId);
      if (res.success) {
        if (res.task.status === 'completed') {
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
          } catch (e) {}
        }
        await fetchPlan();
        await refreshUser();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to remove this task?')) return;
    try {
      await api.deleteTask(id, taskId);
      await fetchPlan();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleDeletePlan = async () => {
    if (!window.confirm('Are you sure you want to delete this entire study plan?')) return;
    try {
      await api.deletePlan(id);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const handleAddTaskToDate = async (dateStr) => {
    if (!newTaskTitle.trim()) return;
    try {
      await api.addTask(id, {
        title: newTaskTitle.trim(),
        estimatedMinutes: Number(newTaskMinutes) || 30,
        scheduledDate: dateStr,
      });
      setNewTaskTitle('');
      setSelectedDateForNewTask('');
      await fetchPlan();
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handlePlanRescued = (updatedPlan, message) => {
    setSuccessMessage(message);
    fetchPlan();
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading catch-up plan...
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-500 font-bold mb-4">{error || 'Plan not found.'}</p>
        <Link to="/dashboard" className="text-brand-500 font-bold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Plan</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 animate-fade-in shadow-sm">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-bold">{successMessage}</span>
        </div>
      )}

      {/* Plan Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {plan.subject}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              {plan.title}
            </h1>
            {plan.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                {plan.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedTaskForCalendar(null);
                  setIsCalendarModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 transition-all hover:scale-105 active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Google Calendar</span>
              </button>

              <button
                onClick={() => setIsRescueModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-brand-500 hover:from-amber-400 hover:to-brand-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Rescue Plan</span>
              </button>
            </div>
            {analytics?.needsRescue && (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {analytics.missedTasks} missed task(s) ready to rescue
              </span>
            )}
          </div>
        </div>

        {/* Progress & Target Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overall Progress
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {analytics?.progress || 0}%
              </span>
              <span className="text-xs text-slate-400">
                ({analytics?.completedTasks || 0}/{analytics?.totalTasks || 0} done)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${analytics?.progress || 0}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Catch-Up Deadline
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <Calendar className="w-5 h-5 text-brand-500" />
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {new Date(plan.targetCatchUpDeadline).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Daily Target
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {Math.round((plan.dailyAvailableMinutes || 120) / 60)} hrs / day
              </span>
            </div>
          </div>
        </div>

        {/* Rescue History Log (if any) */}
        {plan.rescueHistory && plan.rescueHistory.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 mb-1">
              <History className="w-4 h-4" />
              <span>Rescue History ({plan.rescueHistory.length} rebalance events)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Last rescued on{' '}
              {new Date(
                plan.rescueHistory[plan.rescueHistory.length - 1].rescuedAt
              ).toLocaleDateString()}{' '}
              — {plan.rescueHistory[plan.rescueHistory.length - 1].notes}
            </p>
          </div>
        )}
      </div>

      {/* Day-by-Day Timeline */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Day-by-Day Catch-Up Timeline
        </h2>

        {sortedDates.map((dateStr) => {
          const dayTasks = groupedByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const allDayCompleted = dayTasks.every((t) => t.status === 'completed');
          const hasMissed = isPast && !allDayCompleted;

          const dateObj = new Date(dateStr + 'T00:00:00');
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          });

          return (
            <div
              key={dateStr}
              className={`glass-panel rounded-3xl p-5 sm:p-6 border transition-all ${
                isToday
                  ? 'ring-2 ring-brand-500/40 bg-brand-500/5'
                  : hasMissed
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : ''
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    {formattedDate}
                  </span>

                  {isToday && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500 text-white shadow-sm">
                      Today
                    </span>
                  )}

                  {hasMissed && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3" />
                      Missed Tasks
                    </span>
                  )}

                  {allDayCompleted && dayTasks.length > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    {dayTasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0)} mins
                  </span>

                  <button
                    onClick={() =>
                      setSelectedDateForNewTask(selectedDateForNewTask === dateStr ? '' : dateStr)
                    }
                    className="p-1 rounded-lg text-slate-400 hover:text-brand-500 transition-colors"
                    title="Add task to this date"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5">
                {dayTasks.map((task) => {
                  const isDone = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isDone
                          ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-brand-500/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 pr-3">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className="text-slate-400 hover:text-brand-500 transition-transform active:scale-90"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        <div className="flex-1">
                          <span
                            className={`text-sm font-bold ${
                              isDone
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-xs text-slate-400">
                          {task.estimatedMinutes}m
                        </span>

                        {!isDone && (
                          <>
                            <a
                              href={createGoogleCalendarUrl({
                                title: task.title,
                                description: task.description,
                                dateStr: dateStr,
                                durationMinutes: task.estimatedMinutes || 30,
                                subject: plan.subject,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                              title="Set reminder in Google Calendar"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => setActiveFocusTask(task)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors"
                              title="Focus on this task"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Task Input on this day */}
              {selectedDateForNewTask === dateStr && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter micro-task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <select
                    value={newTaskMinutes}
                    onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value={20}>20 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                  <button
                    onClick={() => handleAddTaskToDate(dateStr)}
                    className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rescue Plan Modal */}
      <RescueModal
        plan={plan}
        isOpen={isRescueModalOpen}
        onClose={() => setIsRescueModalOpen(false)}
        onRescued={handlePlanRescued}
      />

      {/* Delete Plan Confirmation Modal */}
      <DeletePlanModal
        plan={plan}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={() => navigate('/dashboard')}
      />

      {/* Google Calendar Modal */}
      <GoogleCalendarModal
        plan={plan}
        task={selectedTaskForCalendar}
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />

      {/* Floating Focus Timer */}
      <PomodoroTimer
        activeTask={activeFocusTask}
        onCompleteTask={(task) => handleToggleTask(task.id)}
      />
    </div>
  );
};
