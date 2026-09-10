const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  formatDate,
  generateSchedule,
  rebalanceSchedule,
  suggestTaskBreakdown,
} = require('../utils/scheduleGenerator');

// All plan routes require authentication
router.use(protect);

// Helper to get today's date string 'YYYY-MM-DD'
const getTodayStr = () => formatDate(new Date());

// @route   GET /api/plans
// @desc    Get all study plans for current user with statistics
// @access  Private
router.get('/', async (req, res) => {
  try {
    const plans = await StudyPlan.find({ userId: req.user._id }).sort({
      updatedAt: -1,
    });

    const todayStr = getTodayStr();

    // Enhance each plan with quick analytics
    const enhancedPlans = plans.map((plan) => {
      const planObj = plan.toObject();
      const total = planObj.tasks.length;
      const completed = planObj.tasks.filter((t) => t.status === 'completed').length;
      const missed = planObj.tasks.filter(
        (t) => t.status !== 'completed' && t.scheduledDate < todayStr
      ).length;
      const todayTasks = planObj.tasks.filter(
        (t) => t.scheduledDate === todayStr && t.status !== 'completed'
      ).length;

      return {
        ...planObj,
        stats: {
          totalTasks: total,
          completedTasks: completed,
          missedTasks: missed,
          todayTasks,
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
          needsRescue: missed > 0,
        },
      };
    });

    res.json({
      success: true,
      plans: enhancedPlans,
    });
  } catch (err) {
    console.error('[PlanRoutes] Get plans error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch study plans.' });
  }
});

// @route   GET /api/plans/analytics
// @desc    Get comprehensive task progress, velocity, and audit trail for student
// @access  Private
router.get('/analytics', async (req, res) => {
  try {
    const plans = await StudyPlan.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    const user = await User.findById(req.user._id);
    const todayStr = getTodayStr();

    let totalTasks = 0;
    let completedTasks = 0;
    let missedTasks = 0;
    let pendingTasks = 0;
    let totalPlannedMinutes = 0;
    let totalTimeSpentMinutes = 0;
    let totalRescuesCount = 0;

    const allTasks = [];
    const subjectMap = {};

    // 14-day activity timeline
    const past14Days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = formatDate(d);
      past14Days.push({
        date: ds,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        completedCount: 0,
        minutesLogged: 0,
      });
    }
    const dayMap = {};
    past14Days.forEach((item) => {
      dayMap[item.date] = item;
    });

    plans.forEach((plan) => {
      totalRescuesCount += (plan.rescueHistory || []).length;
      const sub = plan.subject || 'General';
      if (!subjectMap[sub]) {
        subjectMap[sub] = {
          subject: sub,
          totalTasks: 0,
          completedTasks: 0,
          totalMinutes: 0,
          completedMinutes: 0,
          planCount: 0,
        };
      }
      subjectMap[sub].planCount += 1;

      (plan.tasks || []).forEach((task) => {
        totalTasks += 1;
        totalPlannedMinutes += task.estimatedMinutes || 30;
        totalTimeSpentMinutes += task.timeSpentMinutes || 0;

        subjectMap[sub].totalTasks += 1;
        subjectMap[sub].totalMinutes += task.estimatedMinutes || 30;

        const isCompleted = task.status === 'completed';
        const isMissed = !isCompleted && task.scheduledDate < todayStr;
        const isToday = task.scheduledDate === todayStr;

        if (isCompleted) {
          completedTasks += 1;
          subjectMap[sub].completedTasks += 1;
          subjectMap[sub].completedMinutes += task.estimatedMinutes || 30;

          if (task.completedAt) {
            const cDate = formatDate(new Date(task.completedAt));
            if (dayMap[cDate]) {
              dayMap[cDate].completedCount += 1;
              dayMap[cDate].minutesLogged += task.estimatedMinutes || 30;
            }
          }
        } else if (isMissed) {
          missedTasks += 1;
          pendingTasks += 1;
        } else {
          pendingTasks += 1;
        }

        allTasks.push({
          id: task.id,
          planId: plan._id,
          planTitle: plan.title,
          subject: plan.subject,
          title: task.title,
          description: task.description,
          estimatedMinutes: task.estimatedMinutes || 30,
          timeSpentMinutes: task.timeSpentMinutes || 0,
          priority: task.priority || 'medium',
          status: task.status,
          scheduledDate: task.scheduledDate,
          completedAt: task.completedAt,
          isMissed,
          isToday,
        });
      });
    });

    const subjectBreakdown = Object.values(subjectMap).map((s) => ({
      ...s,
      progress: s.totalTasks > 0 ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0,
    }));

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      summary: {
        totalPlans: plans.length,
        totalTasks,
        completedTasks,
        pendingTasks,
        missedTasks,
        completionRate,
        totalPlannedMinutes,
        totalPlannedHours: Math.round((totalPlannedMinutes / 60) * 10) / 10,
        totalTimeSpentMinutes,
        totalTimeSpentHours: Math.round(((user?.totalStudyMinutes || totalTimeSpentMinutes) / 60) * 10) / 10,
        currentStreak: user?.currentStreak || 0,
        longestStreak: user?.longestStreak || 0,
        totalRescuesCount,
        lastActiveDate: user?.lastActiveDate,
      },
      activityTimeline: past14Days,
      subjectBreakdown,
      allTasks: allTasks.sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || '')),
    });
  } catch (err) {
    console.error('[PlanRoutes] Analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate progress analytics.' });
  }
});

// @route   POST /api/plans/suggest-breakdown
// @desc    Generate bite-sized micro-tasks from a syllabus topic
// @access  Private
router.post('/suggest-breakdown', (req, res) => {
  try {
    const { topic, totalHours } = req.body;
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic name is required for breakdown suggestion.',
      });
    }

    const tasks = suggestTaskBreakdown(topic, totalHours || 2);
    res.json({
      success: true,
      tasks: tasks.map((t) => ({
        id: crypto.randomUUID(),
        ...t,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error generating task breakdown.' });
  }
});

// @route   POST /api/plans
// @desc    Create a new study plan with automatic catch-up schedule
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      title,
      subject,
      description,
      originalDeadline,
      targetCatchUpDeadline,
      dailyAvailableMinutes = 120,
      weekdayAvailableMinutes = 120,
      weekendAvailableMinutes = 240,
      rawTasks = [],
    } = req.body;

    if (!title || !subject || !targetCatchUpDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, and target catch-up deadline are required.',
      });
    }

    const todayStr = getTodayStr();
    const deadlineStr = formatDate(new Date(targetCatchUpDeadline));

    // Prepare formatted tasks with IDs
    const preparedTasks = rawTasks.map((t) => ({
      id: t.id || crypto.randomUUID(),
      title: t.title || 'Untitled Micro-Task',
      description: t.description || '',
      estimatedMinutes: Number(t.estimatedMinutes) || 30,
      priority: t.priority || 'medium',
      status: 'pending',
    }));

    // Generate schedule
    const { scheduledTasks } = generateSchedule({
      tasks: preparedTasks,
      startDateStr: todayStr,
      deadlineDateStr: deadlineStr,
      weekdayMinutes: Number(weekdayAvailableMinutes) || Number(dailyAvailableMinutes) || 120,
      weekendMinutes: Number(weekendAvailableMinutes) || 240,
    });

    const plan = await StudyPlan.create({
      userId: req.user._id,
      title,
      subject,
      description: description || '',
      originalDeadline: originalDeadline ? new Date(originalDeadline) : null,
      targetCatchUpDeadline: new Date(targetCatchUpDeadline),
      dailyAvailableMinutes: Number(dailyAvailableMinutes) || 120,
      weekdayAvailableMinutes: Number(weekdayAvailableMinutes) || 120,
      weekendAvailableMinutes: Number(weekendAvailableMinutes) || 240,
      tasks: scheduledTasks,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Catch-up study plan created successfully!',
      plan,
    });
  } catch (err) {
    console.error('[PlanRoutes] Create plan error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to create study plan.',
    });
  }
});

// @route   GET /api/plans/:id
// @desc    Get detailed study plan by ID with day-grouped view
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Study plan not found.' });
    }

    const todayStr = getTodayStr();

    // Group tasks by scheduledDate
    const groupedByDate = {};
    plan.tasks.forEach((task) => {
      if (!groupedByDate[task.scheduledDate]) {
        groupedByDate[task.scheduledDate] = [];
      }
      groupedByDate[task.scheduledDate].push(task);
    });

    const totalTasks = plan.tasks.length;
    const completedTasks = plan.tasks.filter((t) => t.status === 'completed').length;
    const missedTasks = plan.tasks.filter(
      (t) => t.status !== 'completed' && t.scheduledDate < todayStr
    ).length;

    res.json({
      success: true,
      plan,
      groupedByDate,
      analytics: {
        totalTasks,
        completedTasks,
        missedTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        needsRescue: missedTasks > 0,
        todayStr,
      },
    });
  } catch (err) {
    console.error('[PlanRoutes] Get plan error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve study plan.' });
  }
});

// @route   PATCH /api/plans/:id/tasks/:taskId/toggle
// @desc    Toggle task completion and update student streak
// @access  Private
router.patch('/:id/tasks/:taskId/toggle', async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Study plan not found.' });
    }

    const taskIndex = plan.tasks.findIndex((t) => t.id === req.params.taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Task not found in this plan.' });
    }

    const task = plan.tasks[taskIndex];
    const isNowCompleted = task.status !== 'completed';

    task.status = isNowCompleted ? 'completed' : 'pending';
    task.completedAt = isNowCompleted ? new Date() : null;

    if (req.body.timeSpentMinutes) {
      task.timeSpentMinutes = (task.timeSpentMinutes || 0) + Number(req.body.timeSpentMinutes);
    }

    // Check if entire plan is now completed
    const allCompleted = plan.tasks.every((t) => t.status === 'completed');
    if (allCompleted) {
      plan.status = 'completed';
    } else if (plan.status === 'completed') {
      plan.status = 'active';
    }

    await plan.save();

    // If marked completed, credit activity to user for streak
    let updatedUser = null;
    if (isNowCompleted) {
      const user = await User.findById(req.user._id);
      await user.recordActivity(task.estimatedMinutes || 25);
      updatedUser = {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalTasksCompleted: user.totalTasksCompleted,
        totalStudyMinutes: user.totalStudyMinutes,
      };
    }

    res.json({
      success: true,
      message: isNowCompleted ? 'Task completed! Keep your streak strong!' : 'Task marked as pending.',
      task,
      planProgress: plan.progress,
      userStreak: updatedUser,
    });
  } catch (err) {
    console.error('[PlanRoutes] Toggle task error:', err);
    res.status(500).json({ success: false, message: 'Failed to update task status.' });
  }
});

// @route   POST /api/plans/:id/rescue
// @desc    RESCUE PLAN: Rebalance missed & overdue tasks peacefully starting today
// @access  Private
router.post('/:id/rescue', async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Study plan not found.' });
    }

    const todayStr = getTodayStr();
    const targetDeadlineStr = formatDate(plan.targetCatchUpDeadline);

    const {
      updatedTasks,
      rescheduledCount,
      missedCount,
      extendedDays,
      newDeadline,
      message,
    } = rebalanceSchedule({
      existingTasks: plan.tasks,
      todayStr,
      targetDeadlineStr,
      weekdayMinutes: plan.weekdayAvailableMinutes || plan.dailyAvailableMinutes || 120,
      weekendMinutes: plan.weekendAvailableMinutes || 240,
      extendDaysIfFull: req.body.extendDaysIfFull !== false,
    });

    // Update tasks
    plan.tasks = updatedTasks;
    plan.status = 'rescued';

    // If extended, update target deadline
    if (extendedDays > 0 && newDeadline) {
      plan.rescueHistory.push({
        rescuedAt: new Date(),
        tasksRescheduledCount: rescheduledCount,
        notes: `Plan rescued! Rescheduled ${rescheduledCount} tasks (${missedCount} missed). Deadline extended by ${extendedDays} day(s) to avoid overload.`,
        previousDeadline: plan.targetCatchUpDeadline,
        newDeadline: new Date(newDeadline + 'T23:59:59'),
      });
      plan.targetCatchUpDeadline = new Date(newDeadline + 'T23:59:59');
    } else {
      plan.rescueHistory.push({
        rescuedAt: new Date(),
        tasksRescheduledCount: rescheduledCount,
        notes: `Plan rescued! Rescheduled ${rescheduledCount} tasks (${missedCount} missed) comfortably within current deadline.`,
        previousDeadline: plan.targetCatchUpDeadline,
        newDeadline: plan.targetCatchUpDeadline,
      });
    }

    await plan.save();

    res.json({
      success: true,
      message,
      rescheduledCount,
      missedCount,
      extendedDays,
      plan,
    });
  } catch (err) {
    console.error('[PlanRoutes] Rescue plan error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to rescue and rebalance plan.',
    });
  }
});

// @route   POST /api/plans/:id/tasks
// @desc    Add a new micro-task to plan
// @access  Private
router.post('/:id/tasks', async (req, res) => {
  try {
    const { title, description, estimatedMinutes, priority, scheduledDate } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Study plan not found.' });
    }

    const newTask = {
      id: crypto.randomUUID(),
      title,
      description: description || '',
      estimatedMinutes: Number(estimatedMinutes) || 30,
      priority: priority || 'medium',
      status: 'pending',
      scheduledDate: scheduledDate || getTodayStr(),
    };

    plan.tasks.push(newTask);
    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Task added to plan.',
      task: newTask,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add task.' });
  }
});

// @route   DELETE /api/plans/:id/tasks/:taskId
// @desc    Delete a task from plan
// @access  Private
router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Study plan not found.' });
    }

    plan.tasks = plan.tasks.filter((t) => t.id !== req.params.taskId);
    await plan.save();

    res.json({
      success: true,
      message: 'Task removed successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove task.' });
  }
});

// @route   DELETE /api/plans/:id
// @desc    Delete entire study plan
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const plan = await StudyPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Study plan not found.' });
    }

    res.json({
      success: true,
      message: 'Study plan deleted successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete study plan.' });
  }
});

module.exports = router;
