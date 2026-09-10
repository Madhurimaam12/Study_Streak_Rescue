import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const NewPlan = () => {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [originalDeadline, setOriginalDeadline] = useState('');

  // Default target catch-up deadline: 5 days from today
  const defaultTargetDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  };
  const [targetCatchUpDeadline, setTargetCatchUpDeadline] = useState(defaultTargetDate);

  // Available study hours
  const [dailyAvailableMinutes, setDailyAvailableMinutes] = useState(120); // 2h
  const [weekendAvailableMinutes, setWeekendAvailableMinutes] = useState(240); // 4h

  // Tasks
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Review Chapter Summaries & Lecture Slides',
      description: 'Quick read-through to identify missed concepts',
      estimatedMinutes: 30,
      priority: 'high',
    },
    {
      id: '2',
      title: 'Formulate Key Equations & Definitions Sheet',
      description: 'Condense essentials into a 1-page cheatsheet',
      estimatedMinutes: 25,
      priority: 'high',
    },
    {
      id: '3',
      title: 'Practice Assignment Set 1 & 2',
      description: 'Solve core problems without referencing solutions',
      estimatedMinutes: 45,
      priority: 'medium',
    },
  ]);

  // Topic auto-breakdown input
  const [breakdownTopic, setBreakdownTopic] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-breakdown helper
  const handleSuggestBreakdown = async () => {
    if (!breakdownTopic.trim()) return;
    setSuggesting(true);
    setError('');

    try {
      const res = await api.suggestBreakdown(breakdownTopic, 2);
      if (res.success && res.tasks) {
        setTasks((prev) => [...prev, ...res.tasks]);
        setBreakdownTopic('');
      }
    } catch (err) {
      setError('Could not generate breakdown for this topic.');
    } finally {
      setSuggesting(false);
    }
  };

  // Add custom single task
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const [customTaskMinutes, setCustomTaskMinutes] = useState(30);
  const [customTaskPriority, setCustomTaskPriority] = useState('medium');

  const handleAddCustomTask = (e) => {
    e.preventDefault();
    if (!customTaskTitle.trim()) return;

    setTasks((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: customTaskTitle.trim(),
        description: '',
        estimatedMinutes: Number(customTaskMinutes) || 30,
        priority: customTaskPriority,
      },
    ]);

    setCustomTaskTitle('');
  };

  const handleRemoveTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !subject || !targetCatchUpDeadline) {
      setError('Please provide a title, subject, and target catch-up deadline.');
      return;
    }

    if (tasks.length === 0) {
      setError('Please include at least one task in your catch-up plan.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        subject,
        description,
        originalDeadline: originalDeadline || null,
        targetCatchUpDeadline,
        dailyAvailableMinutes: Number(dailyAvailableMinutes),
        weekdayAvailableMinutes: Number(dailyAvailableMinutes),
        weekendAvailableMinutes: Number(weekendAvailableMinutes),
        rawTasks: tasks,
      };

      const res = await api.createPlan(payload);
      if (res.success) {
        navigate(`/plans/${res.plan._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate catch-up plan.');
    } finally {
      setLoading(false);
    }
  };

  const totalEstimatedMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const totalEstimatedHours = Math.round((totalEstimatedMinutes / 60) * 10) / 10;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Create a Catch-Up Study Plan
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Turn your missed deadlines and overwhelming syllabus into bite-sized daily victories.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Course & Deadlines */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <BookOpen className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              1. Subject & Catch-Up Target
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Subject / Course Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems, Chemistry 101"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Plan Name / Goal *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Midterm Catch-Up Sprint"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Original Missed Deadline (Optional)
              </label>
              <input
                type="date"
                value={originalDeadline}
                onChange={(e) => setOriginalDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                The deadline that passed or got delayed
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                New Target Catch-Up Deadline *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={targetCatchUpDeadline}
                onChange={(e) => setTargetCatchUpDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                When you realistically want all materials caught up
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Daily Available Study Time */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Realistic Daily Time Availability
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Weekday Available Study Time
                </span>
                <span className="text-sm font-black text-brand-600 dark:text-brand-400 font-mono">
                  {Math.round((dailyAvailableMinutes / 60) * 10) / 10} hours/day
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="360"
                step="30"
                value={dailyAvailableMinutes}
                onChange={(e) => setDailyAvailableMinutes(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>30 mins</span>
                <span>2 hours</span>
                <span>4 hours</span>
                <span>6 hours</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Weekend Available Study Time
                </span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                  {Math.round((weekendAvailableMinutes / 60) * 10) / 10} hours/day
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="480"
                step="30"
                value={weekendAvailableMinutes}
                onChange={(e) => setWeekendAvailableMinutes(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 hour</span>
                <span>3 hours</span>
                <span>5 hours</span>
                <span>8 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Task Breakdown */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                3. Micro-Task Breakdown
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
              Total: {tasks.length} tasks ({totalEstimatedHours} hours)
            </span>
          </div>

          {/* Smart Auto-Chunker Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/10 via-amber-500/10 to-orange-500/10 border border-brand-500/20">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-500" />
              <span>Smart Topic Auto-Chunker</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter a syllabus topic or chapter (e.g. Dynamic Programming, Newton's Laws)..."
                value={breakdownTopic}
                onChange={(e) => setBreakdownTopic(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleSuggestBreakdown}
                disabled={suggesting || !breakdownTopic.trim()}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{suggesting ? 'Chunking...' : 'Auto-Breakdown'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Generates 20–40 minute bite-sized tasks (concept review, examples, practice problems, error review).
            </p>
          </div>

          {/* Current Tasks List */}
          <div className="space-y-2.5">
            {tasks.map((task, idx) => (
              <div
                key={task.id || idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3 flex-1 pr-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">{task.title}</p>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{task.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {task.estimatedMinutes}m
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : task.priority === 'low'
                        ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {task.priority}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(task.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Manual Task Form */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Add Custom Micro-Task
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Task title (e.g. Solve 5 practice problems)"
                value={customTaskTitle}
                onChange={(e) => setCustomTaskTitle(e.target.value)}
                className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={customTaskMinutes}
                onChange={(e) => setCustomTaskMinutes(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={15}>15 mins</option>
                <option value={20}>20 mins</option>
                <option value={25}>25 mins (Pomodoro)</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
              </select>
              <button
                type="button"
                onClick={handleAddCustomTask}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 glass-panel rounded-3xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                15% Anti-Burnout Breathing Buffer Enabled
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Schedule leaves natural margin so you never fall behind again.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Generating Catch-Up Plan...' : 'Generate Catch-Up Schedule'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
