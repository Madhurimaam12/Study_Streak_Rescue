/**
 * Automated Verification Script for Study Streak Rescue
 * Tests:
 * 1. Schedule Generation & Breathing Buffer
 * 2. Rescue & Rebalancing of Missed Tasks
 * 3. Topic Auto-Breakdown Chunker
 */

const {
  generateSchedule,
  rebalanceSchedule,
  suggestTaskBreakdown,
  formatDate,
} = require('./utils/scheduleGenerator');

console.log('=== RUNNING STUDY STREAK RESCUE ENGINE VERIFICATION ===\n');

// Test 1: Suggest Breakdown
console.log('1. Testing Topic Auto-Breakdown Chunker:');
const topicTasks = suggestTaskBreakdown('Thermodynamics: Second Law & Entropy', 2.5);
console.log(`- Generated ${topicTasks.length} micro-tasks.`);
if (topicTasks.length >= 5 && topicTasks[0].estimatedMinutes > 0) {
  console.log('  ✅ Auto-Breakdown passed!\n');
} else {
  console.error('  ❌ Auto-Breakdown failed!');
  process.exit(1);
}

// Test 2: Generate Initial Schedule
console.log('2. Testing Schedule Generation:');
const today = new Date();
const deadline = new Date();
deadline.setDate(today.getDate() + 4);

const todayStr = formatDate(today);
const deadlineStr = formatDate(deadline);

const sampleTasks = [
  { id: 't1', title: 'Task 1: Core formulas', estimatedMinutes: 30, priority: 'high', status: 'pending' },
  { id: 't2', title: 'Task 2: Chapter notes', estimatedMinutes: 45, priority: 'high', status: 'pending' },
  { id: 't3', title: 'Task 3: Worked examples', estimatedMinutes: 30, priority: 'medium', status: 'pending' },
  { id: 't4', title: 'Task 4: Practice problem set', estimatedMinutes: 60, priority: 'medium', status: 'pending' },
  { id: 't5', title: 'Task 5: Past exam quiz', estimatedMinutes: 30, priority: 'low', status: 'pending' },
];

const { scheduledTasks, dateRange } = generateSchedule({
  tasks: sampleTasks,
  startDateStr: todayStr,
  deadlineDateStr: deadlineStr,
  weekdayMinutes: 60, // 1 hour per day
  weekendMinutes: 120,
});

console.log(`- Date range: ${dateRange.length} days (${dateRange[0]} to ${dateRange[dateRange.length - 1]})`);
console.log(`- Scheduled tasks count: ${scheduledTasks.length}`);
const allHaveDates = scheduledTasks.every((t) => !!t.scheduledDate);
if (allHaveDates && scheduledTasks.length === 5) {
  console.log('  ✅ Initial schedule generation passed!\n');
} else {
  console.error('  ❌ Schedule generation failed!');
  process.exit(1);
}

// Test 3: Rebalance & Rescue Missed Tasks
console.log('3. Testing 1-Click Plan Rescue & Rebalance:');
// Simulate that tasks t1 was completed, but t2 was scheduled in the past (missed!)
const pastDate = new Date();
pastDate.setDate(today.getDate() - 2);
const pastDateStr = formatDate(pastDate);

const tasksWithMissed = [
  { id: 't1', title: 'Task 1: Core formulas', estimatedMinutes: 30, priority: 'high', status: 'completed', scheduledDate: pastDateStr },
  { id: 't2', title: 'Task 2: Chapter notes (MISSED)', estimatedMinutes: 45, priority: 'high', status: 'pending', scheduledDate: pastDateStr },
  { id: 't3', title: 'Task 3: Worked examples', estimatedMinutes: 30, priority: 'medium', status: 'pending', scheduledDate: todayStr },
  { id: 't4', title: 'Task 4: Practice problem set', estimatedMinutes: 60, priority: 'medium', status: 'pending', scheduledDate: deadlineStr },
];

const rescueResult = rebalanceSchedule({
  existingTasks: tasksWithMissed,
  todayStr: todayStr,
  targetDeadlineStr: deadlineStr,
  weekdayMinutes: 60,
  weekendMinutes: 120,
  extendDaysIfFull: true,
});

console.log(`- Rescheduled count: ${rescueResult.rescheduledCount}`);
console.log(`- Missed count detected: ${rescueResult.missedCount}`);
console.log(`- Message: "${rescueResult.message}"`);

const completedKept = rescueResult.updatedTasks.find((t) => t.id === 't1');
const missedRescheduled = rescueResult.updatedTasks.find((t) => t.id === 't2');

if (
  rescueResult.missedCount === 1 &&
  completedKept.status === 'completed' &&
  completedKept.scheduledDate === pastDateStr &&
  missedRescheduled.scheduledDate >= todayStr
) {
  console.log('  ✅ Rescue & Rebalance successfully rescued missed task starting today without touching completed history!\n');
} else {
  console.error('  ❌ Rescue & Rebalance failed validation!');
  process.exit(1);
}

console.log('🎉 ALL RESCUE ENGINE TESTS PASSED PERFECTLY!');
