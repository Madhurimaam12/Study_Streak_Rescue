import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import {
  LifeBuoy,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';

export const RescueModal = ({
  plan,
  isOpen,
  onClose,
  onRescued,
}) => {
  const [loading, setLoading] = useState(false);
  const [allowExtension, setAllowExtension] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen || !plan) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const missedTasks = plan.tasks.filter(
    (t) => t.status !== 'completed' && t.scheduledDate < todayStr
  );
  const pendingTasks = plan.tasks.filter((t) => t.status !== 'completed');

  const handleRescue = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.rescuePlan(plan._id, {
        extendDaysIfFull: allowExtension,
      });

      if (res.success) {
        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f97316', '#fb923c', '#fdba74', '#38bdf8', '#34d399'],
          });
        } catch (e) {}

        onRescued(res.plan, res.message);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to rescue plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Decorative Top Gradient */}
        <div className="h-3 bg-gradient-to-r from-amber-500 via-brand-500 to-rose-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 flex items-center justify-center">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Study Streak Rescue
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Zero Guilt. 100% Realistic Catch-Up.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context & Explanation */}
          <div className="my-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-700 dark:text-amber-400 mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>What happens during a Rescue?</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Life got busy? Don't worry! We will collect all{' '}
              <strong className="text-brand-600 dark:text-brand-400 font-semibold">
                {missedTasks.length} missed task(s)
              </strong>{' '}
              plus your {pendingTasks.length - missedTasks.length} upcoming tasks, and smoothly
              rebalance them across upcoming available hours starting <strong>Today</strong>.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tasks to Rebalance
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {pendingTasks.length} <span className="text-xs font-medium text-slate-400">tasks</span>
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Daily Capacity
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {Math.round((plan.dailyAvailableMinutes || 120) / 60)}h{' '}
                <span className="text-xs font-medium text-slate-400">/ day</span>
              </p>
            </div>
          </div>

          {/* Burnout Protection Toggle */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer mb-6 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
            <input
              type="checkbox"
              checked={allowExtension}
              onChange={(e) => setAllowExtension(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-brand-500 focus:ring-brand-400"
            />
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Burnout Protection (Recommended)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                If the remaining tasks exceed your daily study capacity, automatically extend the deadline by a few days rather than cramming unsustainably.
              </p>
            </div>
          </label>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRescue}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rebalancing Schedule...</span>
                </>
              ) : (
                <>
                  <span>Rescue My Plan Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
