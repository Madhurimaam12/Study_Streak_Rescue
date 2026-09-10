import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DailyTaskList } from '../components/DailyTaskList';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { RescueModal } from '../components/RescueModal';
import { DeletePlanModal } from '../components/DeletePlanModal';
import {
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  LifeBuoy,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  Award,
  Sparkles,
  BookOpen,
  Trash2,
} from 'lucide-react';

export const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [selectedPlanForRescue, setSelectedPlanForRescue] = useState(null);
  const [selectedPlanForDelete, setSelectedPlanForDelete] = useState(null);
  const [activeFocusTask, setActiveFocusTask] = useState(null);
  const [successBanner, setSuccessBanner] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(false);
      const res = await api.getPlans();
      if (res.success) {
        setPlans(res.plans);
      }
    } catch (err) {
      setError('Could not load your study plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTask = async (planId, taskId) => {
    try {
      const res = await api.toggleTask(planId, taskId);
      if (res.success) {
        // Refresh plans to reflect updated status
        await fetchDashboardData();
        // Refresh user streak stats
        await refreshUser();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handlePlanRescued = (updatedPlan, message) => {
    setSuccessBanner(message);
    fetchDashboardData();
    setTimeout(() => setSuccessBanner(''), 8000);
  };

  const handlePlanDeleted = (deletedPlanId, message) => {
    setPlans((prev) => prev.filter((p) => p._id !== deletedPlanId));
    setSuccessBanner(message || 'Study plan deleted successfully.');
    setTimeout(() => setSuccessBanner(''), 6000);
  };

  // Compile today's tasks across all active plans
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysTasks = [];

  plans.forEach((plan) => {
    (plan.tasks || []).forEach((task) => {
      if (task.scheduledDate === todayStr) {
        todaysTasks.push({
          ...task,
          planId: plan._id,
          planTitle: plan.title,
          subject: plan.subject,
        });
      }
    });
  });

  // Calculate plans that have missed backlog tasks
  const plansNeedingRescue = plans.filter((p) => p.stats?.needsRescue);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-bold">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner('')}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Welcome & Anti-Guilt Streak Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold mb-3">
              <Flame className="w-3.5 h-3.5 fill-brand-400" />
              <span>Study Streak Momentum</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Keep moving forward, {user?.name?.split(' ')[0] || 'Scholar'}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl mt-2 leading-relaxed">
              Never let a missed day derail your progress. The secret isn't perfection — it's having a realistic system to restart anytime.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="flex-1 sm:flex-initial p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[120px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Streak
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-brand-400">
                  {user?.currentStreak || 0}
                </span>
                <span className="text-xs font-semibold text-slate-400">days</span>
              </div>
            </div>

            <div className="flex-1 sm:flex-initial p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[120px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tasks Completed
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {user?.totalTasksCompleted || 0}
                </span>
                <span className="text-xs font-semibold text-slate-400">total</span>
              </div>
            </div>

            <div className="flex-1 sm:flex-initial p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[120px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Study Time
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  {Math.round(((user?.totalStudyMinutes || 0) / 60) * 10) / 10}
                </span>
                <span className="text-xs font-semibold text-slate-400">hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient glow decorative circle */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Emergency Rescue Alert (when tasks are overdue) */}
      {plansNeedingRescue.length > 0 && (
        <div className="rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Rescue Needed: {plansNeedingRescue.length} plan(s) have overdue tasks
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                  Action Recommended
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                You have unfinished tasks from previous dates. Don't let backlog guilt freeze you! Use the 1-click Rescue button to redistribute them into doable daily slots starting today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPlanForRescue(plansNeedingRescue[0])}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Rescue {plansNeedingRescue[0].title}</span>
            </button>
          </div>
        </div>
      )}

      {/* Today's Tasks Section */}
      <DailyTaskList
        tasks={todaysTasks}
        onToggleTask={handleToggleTask}
        onSelectFocusTask={(task) => setActiveFocusTask(task)}
      />

      {/* Study & Catch-Up Plans Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Your Catch-Up & Study Plans
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active roadmaps engineered to guide you through missed deadlines
            </p>
          </div>

          <Link
            to="/plans/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Plan</span>
          </Link>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No study plans created yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              Fallen behind on a deadline or have an exam coming up? Let's turn it into an easy daily schedule.
            </p>
            <Link
              to="/plans/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Build Catch-Up Plan</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const deadlineDate = new Date(plan.targetCatchUpDeadline);
              const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={plan._id}
                  className="glass-panel card-hover rounded-3xl p-6 flex flex-col justify-between border transition-all relative group"
                >
                  <div>
                    {/* Top Row: Subject, Status & Delete */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {plan.subject}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {plan.stats?.needsRescue ? (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            {plan.stats.missedTasks} Missed
                          </span>
                        ) : plan.status === 'completed' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            On Track
                          </span>
                        )}

                        <button
                          onClick={() => setSelectedPlanForDelete(plan)}
                          title="Delete Plan"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                      {plan.title}
                    </h3>
                    {plan.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                        {plan.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-4 mb-4">
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Catch-Up Progress</span>
                        <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                          {plan.stats?.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-brand-500 to-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${plan.stats?.progress || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>{plan.stats?.completedTasks || 0} of {plan.stats?.totalTasks || 0} tasks done</span>
                        <span>{Math.round((plan.dailyAvailableMinutes || 120) / 60)}h / day</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" />
                      <span>Catch-Up Target: <strong className="text-slate-800 dark:text-slate-200">{formattedDeadline}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => setSelectedPlanForRescue(plan)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold transition-colors border border-amber-500/20"
                    >
                      <LifeBuoy className="w-3.5 h-3.5" />
                      <span>Rescue Plan</span>
                    </button>

                    <Link
                      to={`/plans/${plan._id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                    >
                      <span>Timeline</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Pomodoro Timer */}
      <PomodoroTimer
        activeTask={activeFocusTask}
        onCompleteTask={(task) => handleToggleTask(task.planId, task.id)}
      />

      {/* Rescue Plan Confirmation Modal */}
      <RescueModal
        plan={selectedPlanForRescue}
        isOpen={!!selectedPlanForRescue}
        onClose={() => setSelectedPlanForRescue(null)}
        onRescued={handlePlanRescued}
      />

      {/* Delete Plan Confirmation Modal */}
      <DeletePlanModal
        plan={selectedPlanForDelete}
        isOpen={!!selectedPlanForDelete}
        onClose={() => setSelectedPlanForDelete(null)}
        onDeleted={handlePlanDeleted}
      />
    </div>
  );
};
