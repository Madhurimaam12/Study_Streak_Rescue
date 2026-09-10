/**
 * Study Streak Rescue - Schedule & Rescue Engine
 * Distributes tasks realistically without burnout and rebalances missed deadlines with zero guilt.
 */

// Format Date object to 'YYYY-MM-DD' in local date representation
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if a date string is weekend
const isWeekend = (dateStr) => {
  const day = new Date(dateStr + 'T00:00:00').getDay();
  return day === 0 || day === 6; // 0: Sunday, 6: Saturday
};

// Generate list of date strings from start to end (inclusive)
const getDateRange = (startDateStr, endDateStr) => {
  const dates = [];
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');

  // Safety fallback if end is before start
  if (end < start) {
    end.setTime(start.getTime() + 2 * 24 * 60 * 60 * 1000);
  }

  let curr = new Date(start);
  while (curr <= end) {
    dates.push(formatDate(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

/**
 * Generate initial catch-up schedule
 */
const generateSchedule = ({
  tasks,
  startDateStr,
  deadlineDateStr,
  weekdayMinutes = 120,
  weekendMinutes = 240,
}) => {
  const dates = getDateRange(startDateStr, deadlineDateStr);
  if (dates.length === 0) {
    dates.push(startDateStr);
  }

  // Sort tasks by priority: high -> medium -> low
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sortedTasks = [...tasks].sort(
    (a, b) => (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2)
  );

  const dayBuckets = {};
  dates.forEach((d) => {
    const dailyLimit = isWeekend(d) ? weekendMinutes : weekdayMinutes;
    // Keep a 15% buffer for anti-overwhelm breathing room
    dayBuckets[d] = {
      maxMinutes: Math.max(30, Math.floor(dailyLimit * 0.85)),
      usedMinutes: 0,
      tasks: [],
    };
  });

  let dateIndex = 0;
  const scheduledTasks = [];

  for (const task of sortedTasks) {
    const taskMinutes = task.estimatedMinutes || 30;
    let placed = false;

    // Try finding a date bucket that has room
    for (let i = dateIndex; i < dates.length; i++) {
      const d = dates[i];
      const bucket = dayBuckets[d];

      // If bucket has room OR it's currently empty, place it here
      if (bucket.usedMinutes + taskMinutes <= bucket.maxMinutes || bucket.tasks.length === 0) {
        bucket.usedMinutes += taskMinutes;
        bucket.tasks.push(task);
        scheduledTasks.push({
          ...task,
          scheduledDate: d,
        });
        placed = true;
        break;
      }
    }

    // If all buckets are full, place on the final days or rotate evenly
    if (!placed) {
      const fallbackDate = dates[dateIndex % dates.length];
      dayBuckets[fallbackDate].usedMinutes += taskMinutes;
      dayBuckets[fallbackDate].tasks.push(task);
      scheduledTasks.push({
        ...task,
        scheduledDate: fallbackDate,
      });
      dateIndex++;
    }
  }

  return {
    scheduledTasks,
    dateRange: dates,
    totalPlannedMinutes: scheduledTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0),
  };
};

/**
 * Rebalance and rescue an existing plan
 * Takes uncompleted tasks (especially missed ones from past days)
 * and redistributes them gently across remaining days starting TODAY.
 */
const rebalanceSchedule = ({
  existingTasks,
  todayStr,
  targetDeadlineStr,
  weekdayMinutes = 120,
  weekendMinutes = 240,
  extendDaysIfFull = true,
}) => {
  // 1. Separate completed vs uncompleted
  const completedTasks = existingTasks.filter((t) => t.status === 'completed');
  const pendingTasks = existingTasks.filter((t) => t.status !== 'completed');

  // Identify missed tasks (scheduled before today)
  const missedTasks = pendingTasks.filter((t) => t.scheduledDate < todayStr);

  // If no pending tasks, nothing to rescue!
  if (pendingTasks.length === 0) {
    return {
      updatedTasks: existingTasks,
      rescheduledCount: 0,
      missedCount: 0,
      message: 'All tasks are already completed! Fantastic job maintaining your streak.',
    };
  }

  // Determine date range from today to targetDeadline
  let dates = getDateRange(todayStr, targetDeadlineStr);

  // Calculate total pending minutes
  const totalPendingMinutes = pendingTasks.reduce(
    (sum, t) => sum + (t.estimatedMinutes || 30),
    0
  );

  // Calculate available capacity
  const calcCapacity = (dateList) =>
    dateList.reduce((sum, d) => {
      const limit = isWeekend(d) ? weekendMinutes : weekdayMinutes;
      return sum + Math.max(30, Math.floor(limit * 0.85));
    }, 0);

  let totalAvailableMinutes = calcCapacity(dates);

  // If over-capacity and user allows extending days, calculate recommended extension
  let extendedDays = 0;
  if (totalPendingMinutes > totalAvailableMinutes && extendDaysIfFull) {
    let lastDate = new Date(dates[dates.length - 1] + 'T00:00:00');
    while (totalPendingMinutes > totalAvailableMinutes && extendedDays < 14) {
      lastDate.setDate(lastDate.getDate() + 1);
      const newDateStr = formatDate(lastDate);
      dates.push(newDateStr);
      extendedDays++;
      totalAvailableMinutes = calcCapacity(dates);
    }
  }

  // Schedule uncompleted tasks across the dates starting today
  const { scheduledTasks: rebalancedPendingTasks } = generateSchedule({
    tasks: pendingTasks,
    startDateStr: todayStr,
    deadlineDateStr: dates[dates.length - 1],
    weekdayMinutes,
    weekendMinutes,
  });

  // Combine completed tasks (unaltered) with rebalanced pending tasks
  const updatedTasks = [...completedTasks, ...rebalancedPendingTasks];

  const newDeadlineStr = dates[dates.length - 1];

  return {
    updatedTasks,
    rescheduledCount: pendingTasks.length,
    missedCount: missedTasks.length,
    extendedDays,
    newDeadline: newDeadlineStr,
    totalPendingMinutes,
    message:
      missedTasks.length > 0
        ? `Rescue complete! ${missedTasks.length} missed task(s) were peacefully rescheduled starting today. No guilt, just a fresh start!`
        : `Schedule rebalanced across ${dates.length} days for maximum focus and minimum stress.`,
  };
};

/**
 * Intelligent topic micro-task chunker
 * Splits any syllabus topic or chapter into small 20-40 min actionable chunks
 */
const suggestTaskBreakdown = (topicTitle, totalHours = 2) => {
  const baseTitle = topicTitle || 'Study Topic';

  return [
    {
      title: `${baseTitle}: Core Concepts & Summary Notes`,
      description: 'Read key definitions, main theorems, and summarize primary takeaways.',
      estimatedMinutes: 30,
      priority: 'high',
    },
    {
      title: `${baseTitle}: Formulas & Cheatsheet Setup`,
      description: 'Create a 1-page quick formula & rule reference sheet.',
      estimatedMinutes: 20,
      priority: 'high',
    },
    {
      title: `${baseTitle}: Step-by-Step Solved Examples`,
      description: 'Walk through 3-4 textbook or lecture examples in detail.',
      estimatedMinutes: 35,
      priority: 'medium',
    },
    {
      title: `${baseTitle}: Focused Practice & Problem Solving`,
      description: 'Solve textbook exercises or assignment questions independently.',
      estimatedMinutes: 40,
      priority: 'medium',
    },
    {
      title: `${baseTitle}: Error Review & Difficult Edge Cases`,
      description: 'Identify where mistakes occurred and test complex edge cases.',
      estimatedMinutes: 25,
      priority: 'medium',
    },
    {
      title: `${baseTitle}: Rapid Recall & 5-Min Flash Quiz`,
      description: 'Active recall testing without notes to solidify knowledge.',
      estimatedMinutes: 20,
      priority: 'low',
    },
  ];
};

module.exports = {
  formatDate,
  isWeekend,
  getDateRange,
  generateSchedule,
  rebalanceSchedule,
  suggestTaskBreakdown,
};
