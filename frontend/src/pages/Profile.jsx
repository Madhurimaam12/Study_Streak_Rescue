import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RescueModal } from '../components/RescueModal';
import { DeletePlanModal } from '../components/DeletePlanModal';
import {
  User,
  Lock,
  Mail,
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  LifeBuoy,
  PlusCircle,
  ArrowUpRight,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  KeyRound,
  Check,
} from 'lucide-react';

export const Profile = () => {
  const { user, refreshUser } = useAuth();

  // Username state
  const [name, setName] = useState(user?.name || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // All Plans state
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanForRescue, setSelectedPlanForRescue] = useState(null);
  const [selectedPlanForDelete, setSelectedPlanForDelete] = useState(null);
  const [planSuccessBanner, setPlanSuccessBanner] = useState('');

  const fetchUserPlans = async () => {
    try {
      setPlansLoading(true);
      const res = await api.getPlans();
      if (res.success) {
        setPlans(res.plans);
      }
    } catch (err) {
      console.error('Error fetching plans for profile:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    fetchUserPlans();
  }, [user]);

  // Handle Username Update
  const handleUpdateName = async (e) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');

    if (!name.trim()) {
      setNameError('Username cannot be empty.');
      return;
    }

    setNameLoading(true);
    try {
      const res = await api.updateProfile({ name: name.trim() });
      if (res.success) {
        setNameSuccess('Username updated successfully!');
        await refreshUser();
        setTimeout(() => setNameSuccess(''), 4000);
      }
    } catch (err) {
      setNameError(err.message || 'Failed to update username.');
    } finally {
      setNameLoading(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword) {
      setPassError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.updateProfile({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setPassSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassSuccess(''), 4000);
      }
    } catch (err) {
      setPassError(err.message || 'Failed to update password.');
    } finally {
      setPassLoading(false);
    }
  };

  const handlePlanRescued = (updatedPlan, message) => {
    setPlanSuccessBanner(message);
    fetchUserPlans();
    setTimeout(() => setPlanSuccessBanner(''), 6000);
  };

  const handlePlanDeleted = (deletedPlanId, message) => {
    setPlans((prev) => prev.filter((p) => p._id !== deletedPlanId));
    setPlanSuccessBanner(message || 'Study plan deleted.');
    setTimeout(() => setPlanSuccessBanner(''), 6000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 text-2xl sm:text-3xl font-black">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {user?.name || 'Student Profile'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500 text-white">
                  Active Scholar
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          {/* User Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[100px] text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Streak
              </span>
              <span className="text-2xl font-black text-brand-400 font-mono">
                {user?.currentStreak || 0}d
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[100px] text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Tasks Done
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {user?.totalTasksCompleted || 0}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[100px] text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Study Time
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {Math.round(((user?.totalStudyMinutes || 0) / 60) * 10) / 10}h
              </span>
            </div>
          </div>
        </div>

        <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Profile Settings (Username & Password) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Username Box */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <User className="w-5 h-5 text-brand-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Change Username
            </h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Update the display name associated with your study streak and certificates.
          </p>

          {nameSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{nameSuccess}</span>
            </div>
          )}

          {nameError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {nameError}
            </div>
          )}

          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Username / Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email (Account Identifier)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Email cannot be changed directly for streak security.
              </span>
            </div>

            <button
              type="submit"
              disabled={nameLoading}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {nameLoading ? 'Saving...' : 'Save Username'}
            </button>
          </form>
        </div>

        {/* Change Password Box */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <KeyRound className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Change Password
            </h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ensure your study account stays secure by using a strong password.
          </p>

          {passSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {passError}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Min 6 chars"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passLoading}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold text-xs transition-all disabled:opacity-50"
              >
                {passLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* All Created Plans Section */}
      <div className="space-y-4">
        {planSuccessBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{planSuccessBanner}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-500" />
              <span>All Created Study & Catch-Up Plans</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and manage all your historical and active study roadmaps
            </p>
          </div>

          <Link
            to="/plans/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Plan</span>
          </Link>
        </div>

        {plansLoading ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Loading your study plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No study plans created yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Turn your deadlines into small daily tasks with zero guilt.
            </p>
            <Link
              to="/plans/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Plan</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const deadlineDate = new Date(plan.targetCatchUpDeadline);
              const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={plan._id}
                  className="glass-panel card-hover rounded-3xl p-6 flex flex-col justify-between border transition-all relative group"
                >
                  <div>
                    {/* Header: Subject & Actions */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {plan.subject}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {plan.stats?.needsRescue ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            {plan.stats.missedTasks} Missed
                          </span>
                        ) : plan.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Active
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

                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                      {plan.title}
                    </h3>
                    {plan.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {plan.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-3 mb-4">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-400">Progress</span>
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
                        <span>{Math.round((plan.dailyAvailableMinutes || 120) / 60)}h/day</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" />
                      <span>Target: <strong className="text-slate-800 dark:text-slate-200">{formattedDeadline}</strong></span>
                    </div>
                  </div>

                  {/* Plan Footer Actions */}
                  <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setSelectedPlanForRescue(plan)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold transition-colors border border-amber-500/20"
                    >
                      <LifeBuoy className="w-3.5 h-3.5" />
                      <span>Rescue</span>
                    </button>

                    <Link
                      to={`/plans/${plan._id}`}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
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
