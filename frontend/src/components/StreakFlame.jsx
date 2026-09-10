import React from 'react';
import { Flame, ShieldCheck } from 'lucide-react';

export const StreakFlame = ({ streak = 0, longestStreak = 0, size = 'md' }) => {
  const isZero = streak === 0;

  return (
    <div className="flex items-center gap-2 group relative">
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all shadow-sm ${
          isZero
            ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            : 'bg-gradient-to-r from-amber-500/10 via-brand-500/15 to-orange-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30'
        }`}
      >
        <Flame
          className={`w-5 h-5 ${
            isZero
              ? 'text-slate-400 dark:text-slate-500'
              : 'text-brand-500 fill-brand-500 animate-flame'
          }`}
        />
        <span className="text-sm font-extrabold tracking-tight">
          {streak} {streak === 1 ? 'Day Streak' : 'Days Streak'}
        </span>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-900 text-slate-100 text-xs rounded-xl shadow-xl border border-slate-800 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
        <div className="flex items-center gap-1.5 font-semibold text-brand-400 mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Anti-Guilt Streak Protection</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          {isZero
            ? 'Complete any task today to light your rescue flame!'
            : `You're on a ${streak}-day roll! Missed a day? Our Rescue engine recalculates without wiping out your spirit.`}
        </p>
        {longestStreak > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Personal Best:</span>
            <span className="font-bold text-slate-200">{longestStreak} days</span>
          </div>
        )}
      </div>
    </div>
  );
};
