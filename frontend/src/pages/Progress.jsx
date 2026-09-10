import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { createGoogleCalendarUrl } from '../utils/calendarHelper';
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  LifeBuoy,
  Search,
  Filter,
  Layers,
  Calendar,
  Award,
  Sparkles,
  BarChart2,
  Play,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const Progress = () => {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters for the Task Audit Trail
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | completed | pending | missed | today
  const [priorityFilter, setPriorityFilter] = useState('all'); // all | high | medium | low
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Focus Timer active task
  const [activeFocusTask, setActiveFocusTask] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getProgressAnalytics();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load progress analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleToggleTask = async (planId, taskId, isCurrentlyComplete) => {
    try {
      const res = await api.toggleTask(planId, taskId);
      if (res.success) {
        if (!isCurrentlyComplete) {
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
          } catch (e) {}
        }
        await fetchAnalytics();
        await refreshUser();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // Filtered task list
  const filteredTasks = useMemo(() => {
    if (!data?.allTasks) return [];

    return data.allTasks.filter((task) => {
      // Search text filter
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.planTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.subject?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'completed' && task.status !== 'completed') return false;
      if (statusFilter === 'pending' && task.status === 'completed') return false;
      if (statusFilter === 'missed' && (!task.isMissed || task.status === 'completed')) return false;
      if (statusFilter === 'today' && !task.isToday) return false;

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      // Subject filter
      if (subjectFilter !== 'all' && task.subject !== subjectFilter) return false;

      return true;
    });
  }, [data, searchQuery, statusFilter, priorityFilter, subjectFilter]);

  // Unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    if (!data?.subjectBreakdown) return [];
    return data.subjectBreakdown.map((s) => s.subject);
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 font-semibold">
        Loading comprehensive task progress...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-500 font-bold mb-4">{error || 'Could not load analytics.'}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, activityTimeline, subjectBreakdown } = data;

  // Max daily completions in timeline for scaling the bars
  const maxDayCompletions = Math.max(
    1,
    ...activityTimeline.map((d) => d.completedCount || 0)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Study Progress & Task Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete data on your study velocity, completed milestones, and streak momentum
          </p>
        </div>

        <Link
          to="/plans/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all self-start sm:self-auto"
        >
          <span>+ Create Catch-Up Plan</span>
        </Link>
      </div>

      {/* Top High-Level Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Completion Rate */}
        <div className="col-span-2 sm:col-span-1 glass-panel rounded-3xl p-5 border">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overall Completion
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {summary.completionRate}%
            </span>
            <span className="text-[11px] text-slate-400">
              ({summary.completedTasks}/{summary.totalTasks})
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.completionRate}%` }}
            />
          </div>
        </div>

        {/* Current Streak */}
        <div className="glass-panel rounded-3xl p-5 border">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Study Streak
            </span>
            <Flame className="w-4 h-4 text-brand-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-brand-500 font-mono">
              {summary.currentStreak}
            </span>
            <span className="text-xs font-semibold text-slate-400">days</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Personal Record: <strong>{summary.longestStreak} days</strong>
          </p>
        </div>

        {/* Study Hours */}
        <div className="glass-panel rounded-3xl p-5 border">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Hours Studied
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {summary.totalTimeSpentHours}
            </span>
            <span className="text-xs font-semibold text-slate-400">hrs</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Planned Total: <strong>{summary.totalPlannedHours} hrs</strong>
          </p>
        </div>

        {/* Rescued Plans */}
        <div className="glass-panel rounded-3xl p-5 border">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Rescue Rebalances
            </span>
            <LifeBuoy className="w-4 h-4 text-brand-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {summary.totalRescuesCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">times</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Guilt-free restarts used
          </p>
        </div>

        {/* Backlog / Missed Tasks */}
        <div className="col-span-2 sm:col-span-1 glass-panel rounded-3xl p-5 border">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overdue Tasks
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-black font-mono ${summary.missedTasks > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {summary.missedTasks}
            </span>
            <span className="text-xs font-semibold text-slate-400">tasks</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {summary.missedTasks > 0 ? 'Ready for 1-click rescue' : 'Backlog clean!'}
          </p>
        </div>
      </div>

      {/* 14-Day Velocity Bar Chart */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-500" />
              <span>14-Day Study Velocity & Task Completions</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daily completed tasks over the past two weeks
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-3 h-3 rounded-md bg-brand-500 inline-block" />
              Tasks Finished
            </span>
          </div>
        </div>

        {/* Interactive Velocity Bars */}
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 pt-6 pb-2 px-1">
          {activityTimeline.map((day) => {
            const heightPercent =
              day.completedCount > 0
                ? Math.max(15, Math.round((day.completedCount / maxDayCompletions) * 100))
                : 4;

            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                  <div className="bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 shadow-xl whitespace-nowrap border border-slate-800">
                    <p className="font-bold">{day.dayLabel}</p>
                    <p className="text-brand-400">{day.completedCount} task(s) completed</p>
                    {day.minutesLogged > 0 && <p className="text-slate-300">{day.minutesLogged} mins study</p>}
                  </div>
                </div>

                {/* The Bar */}
                <div
                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 group-hover:brightness-110 ${
                    day.completedCount > 0
                      ? isToday
                        ? 'bg-gradient-to-t from-brand-600 to-amber-400 shadow-md shadow-brand-500/20'
                        : 'bg-brand-500'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Day Label */}
                <span
                  className={`text-[9px] sm:text-[10px] mt-2 font-mono truncate max-w-[36px] ${
                    isToday ? 'font-black text-brand-500' : 'text-slate-400'
                  }`}
                >
                  {day.dayLabel.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject-by-Subject Progress Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <span>Progress by Subject & Course</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {subjectBreakdown.length} Subject(s) Tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectBreakdown.map((subj) => (
            <div
              key={subj.subject}
              className="glass-panel card-hover rounded-3xl p-5 border transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {subj.subject}
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {subj.progress}%
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 my-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-500 to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${subj.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>
                  {subj.completedTasks} of {subj.totalTasks} tasks done
                </span>
                <span className="font-mono">
                  {Math.round((subj.totalMinutes / 60) * 10) / 10} hrs total
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comprehensive Filterable Tasks Log */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-500" />
              <span>Complete Task Audit Log</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filter, search, and manage all tasks across your catch-up plans
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl self-start sm:self-auto">
            Showing {filteredTasks.length} of {data.allTasks.length} tasks
          </span>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by task title, course, or plan name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            {[
              { key: 'all', label: 'All' },
              { key: 'completed', label: 'Done' },
              { key: 'pending', label: 'Pending' },
              { key: 'missed', label: 'Overdue' },
              { key: 'today', label: 'Today' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === tab.key
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subject Filter Dropdown */}
          {uniqueSubjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No tasks match your current filter settings.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'completed';

              return (
                <div
                  key={`${task.planId}-${task.id}`}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                      : task.isMissed
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-brand-500/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 pr-3">
                    <button
                      onClick={() => handleToggleTask(task.planId, task.id, isDone)}
                      className="text-slate-400 hover:text-brand-500 transition-transform active:scale-90 shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`text-sm font-bold ${
                            isDone
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {task.subject}
                        </span>

                        {task.isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-500 text-white">
                            Today
                          </span>
                        )}

                        {task.isMissed && !isDone && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Overdue
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-[11px] font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {task.scheduledDate}
                        </span>
                        <span className="font-mono text-[11px]">{task.estimatedMinutes}m</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isDone && (
                      <>
                        <a
                          href={createGoogleCalendarUrl({
                            title: task.title,
                            description: task.description,
                            dateStr: task.scheduledDate,
                            durationMinutes: task.estimatedMinutes || 30,
                            subject: task.subject,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                          title="Remind in Google Calendar"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => setActiveFocusTask(task)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors"
                          title="Start focus timer on this task"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </>
                    )}

                    <Link
                      to={`/plans/${task.planId}`}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="View Plan Timeline"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Motivational Resilience Badges */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span>Rescue & Resilience Milestones</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-2xl border text-center transition-all ${
              summary.completedTasks >= 1
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <h3 className="text-xs font-bold">First Step Taken</h3>
            <p className="text-[10px] mt-1">Completed your 1st micro-task</p>
          </div>

          <div
            className={`p-4 rounded-2xl border text-center transition-all ${
              summary.currentStreak >= 3
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-700 dark:text-brand-400'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <Flame className="w-6 h-6 mx-auto mb-2 text-brand-500" />
            <h3 className="text-xs font-bold">Streak Starter</h3>
            <p className="text-[10px] mt-1">Maintained 3-day active streak</p>
          </div>

          <div
            className={`p-4 rounded-2xl border text-center transition-all ${
              summary.totalRescuesCount >= 1
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <LifeBuoy className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <h3 className="text-xs font-bold">Rescue Champion</h3>
            <p className="text-[10px] mt-1">Restarted smoothly after falling behind</p>
          </div>

          <div
            className={`p-4 rounded-2xl border text-center transition-all ${
              summary.completedTasks >= 10
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
            <h3 className="text-xs font-bold">Momentum Master</h3>
            <p className="text-[10px] mt-1">Crushed 10+ micro-tasks</p>
          </div>
        </div>
      </div>

      {/* Floating Focus Pomodoro */}
      <PomodoroTimer
        activeTask={activeFocusTask}
        onCompleteTask={(task) => handleToggleTask(task.planId, task.id, false)}
      />
    </div>
  );
};
