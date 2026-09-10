/**
 * End-to-End API Integration Test for Study Streak Rescue
 */

const http = require('http');

const runTest = async () => {
  process.env.PORT = '5055';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/study_streak_rescue_test';
  process.env.JWT_SECRET = 'test_secret_key_123';

  console.log('--- STARTING END-TO-END INTEGRATION TEST ---');

  // Require backend server
  const express = require('express');
  const cors = require('cors');
  const connectDB = require('./config/db');

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Connect to DB (will automatically use MongoMemoryServer if mongod not running)
  await connectDB();

  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/plans', require('./routes/planRoutes'));

  const server = app.listen(5055, async () => {
    console.log('✅ Test server listening on port 5055');

    const fetchJson = async (path, options = {}) => {
      const response = await fetch(`http://localhost:5055${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        ...options,
      });
      const data = await response.json();
      return { status: response.status, data };
    };

    try {
      // 1. Test Register
      console.log('\n1. Testing Registration (/api/auth/register)...');
      const regRes = await fetchJson('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Morgan Scholar',
          email: `morgan.${Date.now()}@university.edu`,
          password: 'securePassword123',
        }),
      });
      if (regRes.status !== 201 || !regRes.data.token) {
        throw new Error(`Register failed: ${JSON.stringify(regRes.data)}`);
      }
      const token = regRes.data.token;
      console.log('   ✅ Registered successfully. Token acquired.');

      // 2. Test Get Me Profile
      console.log('\n2. Testing Get Profile (/api/auth/me)...');
      const meRes = await fetchJson('/api/auth/me', { token });
      if (meRes.status !== 200 || meRes.data.user.name !== 'Morgan Scholar') {
        throw new Error(`Get me failed: ${JSON.stringify(meRes.data)}`);
      }
      console.log(`   ✅ Profile verified. Current Streak: ${meRes.data.user.currentStreak}`);

      // 2b. Test Update Profile & Password (/api/auth/profile)
      console.log('\n2b. Testing Update Profile & Password (/api/auth/profile)...');
      const userEmail = meRes.data.user.email;
      const updateProfRes = await fetchJson('/api/auth/profile', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          name: 'Morgan Rivera',
          currentPassword: 'securePassword123',
          newPassword: 'newSecurePassword789',
        }),
      });
      if (updateProfRes.status !== 200 || updateProfRes.data.user.name !== 'Morgan Rivera') {
        throw new Error(`Update profile failed: ${JSON.stringify(updateProfRes.data)}`);
      }
      console.log(`   ✅ Username updated to: ${updateProfRes.data.user.name}`);

      // Verify login with new password
      const reLoginRes = await fetchJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: userEmail,
          password: 'newSecurePassword789',
        }),
      });
      if (reLoginRes.status !== 200 || !reLoginRes.data.token) {
        throw new Error(`Login with new password failed: ${JSON.stringify(reLoginRes.data)}`);
      }
      console.log('   ✅ Logged in successfully using newly updated password.');

      // 3. Test Create Study Plan
      console.log('\n3. Testing Catch-Up Plan Creation (/api/plans)...');
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 3);

      const planRes = await fetchJson('/api/plans', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: 'Algorithms Midterm Catch-Up',
          subject: 'Computer Science',
          description: 'Catching up on dynamic programming and graph theory.',
          targetCatchUpDeadline: targetDate.toISOString().split('T')[0],
          dailyAvailableMinutes: 120,
          rawTasks: [
            { id: 'task-1', title: 'DP memoization practice', estimatedMinutes: 30, priority: 'high' },
            { id: 'task-2', title: 'Bellman-Ford algorithm', estimatedMinutes: 45, priority: 'high' },
            { id: 'task-3', title: 'Floyd-Warshall all-pairs', estimatedMinutes: 35, priority: 'medium' },
          ],
        }),
      });

      if (planRes.status !== 201 || !planRes.data.plan) {
        throw new Error(`Create plan failed: ${JSON.stringify(planRes.data)}`);
      }
      const plan = planRes.data.plan;
      console.log(`   ✅ Plan created with ${plan.tasks.length} auto-scheduled tasks.`);

      // 4. Test Task Completion & Streak Recording
      console.log('\n4. Testing Task Completion (/api/plans/:id/tasks/:taskId/toggle)...');
      const toggleRes = await fetchJson(`/api/plans/${plan._id}/tasks/task-1/toggle`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ timeSpentMinutes: 30 }),
      });
      if (toggleRes.status !== 200 || toggleRes.data.task.status !== 'completed') {
        throw new Error(`Toggle task failed: ${JSON.stringify(toggleRes.data)}`);
      }
      console.log(`   ✅ Task 1 marked complete. User streak incremented: ${toggleRes.data.userStreak?.currentStreak} day(s).`);

      // 5. Simulate Missed Task from Yesterday and Test 1-Click Rescue
      console.log('\n5. Testing 1-Click Plan Rescue (/api/plans/:id/rescue)...');
      // Artificially modify task-2 to have a scheduled date in the past
      const StudyPlan = require('./models/StudyPlan');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await StudyPlan.updateOne(
        { _id: plan._id, 'tasks.id': 'task-2' },
        { $set: { 'tasks.$.scheduledDate': yesterdayStr } }
      );

      const rescueRes = await fetchJson(`/api/plans/${plan._id}/rescue`, {
        method: 'POST',
        token,
        body: JSON.stringify({ extendDaysIfFull: true }),
      });

      if (rescueRes.status !== 200 || !rescueRes.data.success) {
        throw new Error(`Rescue failed: ${JSON.stringify(rescueRes.data)}`);
      }
      console.log(`   ✅ Plan rescued successfully!`);
      console.log(`   Rescue Message: "${rescueRes.data.message}"`);
      console.log(`   Rescheduled tasks count: ${rescueRes.data.rescheduledCount}`);

      // Verify task-2 scheduledDate is now >= today
      const todayStr = new Date().toISOString().split('T')[0];
      const rescuedTask2 = rescueRes.data.plan.tasks.find((t) => t.id === 'task-2');
      if (rescuedTask2.scheduledDate < todayStr) {
        throw new Error(`Overdue task was not rescheduled to today or future!`);
      }
      console.log(`   ✅ Confirmed: Overdue task rescheduled to ${rescuedTask2.scheduledDate} (today/future).`);

      // 6. Test Progress Analytics Endpoint
      console.log('\n6. Testing Progress Analytics (/api/plans/analytics)...');
      const analyticsRes = await fetchJson('/api/plans/analytics', { token });
      if (analyticsRes.status !== 200 || !analyticsRes.data.success) {
        throw new Error(`Get analytics failed: ${JSON.stringify(analyticsRes.data)}`);
      }
      const summary = analyticsRes.data.summary;
      console.log(`   ✅ Analytics verified!`);
      console.log(`   - Completion Rate: ${summary.completionRate}%`);
      console.log(`   - Completed Tasks: ${summary.completedTasks}`);
      console.log(`   - Rescues Performed: ${summary.totalRescuesCount}`);
      console.log(`   - Activity Timeline Days: ${analyticsRes.data.activityTimeline?.length}`);
      console.log(`   - Task Audit Log Count: ${analyticsRes.data.allTasks?.length}`);

      // 7. Test Delete Study Plan
      console.log('\n7. Testing Plan Deletion (/api/plans/:id)...');
      const deleteRes = await fetchJson(`/api/plans/${plan._id}`, {
        method: 'DELETE',
        token,
      });
      if (deleteRes.status !== 200 || !deleteRes.data.success) {
        throw new Error(`Delete plan failed: ${JSON.stringify(deleteRes.data)}`);
      }
      console.log(`   ✅ Plan deleted successfully.`);

      // Verify plan is no longer fetchable
      const getDeletedRes = await fetchJson(`/api/plans/${plan._id}`, { token });
      if (getDeletedRes.status !== 404) {
        throw new Error(`Deleted plan still accessible via GET: ${getDeletedRes.status}`);
      }
      console.log(`   ✅ Confirmed: Deleted plan returns 404 Not Found.`);

      console.log('\n======================================================');
      console.log('🎉 ALL END-TO-END TESTS PASSED WITH 100% SUCCESS!');
      console.log('======================================================\n');

      server.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ E2E TEST FAILED:', err.message);
      server.close();
      process.exit(1);
    }
  });
};

runTest();
