import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Download,
  ExternalLink,
  Bell,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { createGoogleCalendarUrl, generateIcsCalendar, downloadIcsFile } from '../utils/calendarHelper';

export const GoogleCalendarModal = ({
  plan,
  task = null, // if provided, targets a single task; otherwise targets the plan
  isOpen,
  onClose,
}) => {
  const [preferredTime, setPreferredTime] = useState('10:00');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !plan) return null;

  const targetTasks = task ? [task] : plan.tasks || [];
  const pendingTasks = targetTasks.filter((t) => t.status !== 'completed');

  // Generate 1-click Google Calendar URL for the first pending task
  const primaryTask = task || pendingTasks[0] || targetTasks[0];
  const googleCalendarUrl = primaryTask
    ? createGoogleCalendarUrl({
        title: primaryTask.title,
        description: primaryTask.description,
        dateStr: primaryTask.scheduledDate,
        timeStr: preferredTime,
        durationMinutes: primaryTask.estimatedMinutes || 30,
        subject: plan.subject,
      })
    : 'https://calendar.google.com/';

  const handleExportAll = () => {
    const icsData = generateIcsCalendar({
      planTitle: plan.title,
      subject: plan.subject,
      tasks: targetTasks,
      preferredStartTime: preferredTime,
    });

    const safeFileName = `${plan.subject || 'study'}-catch-up-schedule.ics`.replace(/[\s/]/g, '-');
    downloadIcsFile(safeFileName, icsData);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Gradient */}
        <div className="h-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-brand-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Add to Google Calendar
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Set automatic study reminders & guard your streak
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

          {/* Time Preference Selector */}
          <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>Preferred Daily Study Start Time</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Reminders will fire 15 mins prior.
              </span>
            </div>
          </div>

          {/* Target Info */}
          <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-slate-800 dark:text-slate-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
              <Bell className="w-4 h-4" />
              <span>
                {task ? `Single Task: "${task.title}"` : `Entire Schedule: ${targetTasks.length} Tasks`}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {task
                ? `Scheduled for ${task.scheduledDate} (${task.estimatedMinutes || 30} mins).`
                : `Exports all tasks for "${plan.title}" across upcoming days.`}
            </p>
          </div>

          {downloadSuccess && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Calendar file downloaded! In Google Calendar, click <strong>Settings ⚙️ &rarr; Import & Export</strong> to load all events with reminders instantly!
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* 1-Click Open in Google Calendar */}
            {primaryTask && (
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01] active:scale-95 text-center"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open {task ? 'Task' : 'Next Task'} in Google Calendar</span>
              </a>
            )}

            {/* Export All as .ICS file */}
            {!task && (
              <button
                type="button"
                onClick={handleExportAll}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-4 h-4 text-brand-500" />
                <span>Export All {targetTasks.length} Tasks with Reminders (.ics)</span>
              </button>
            )}
          </div>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
