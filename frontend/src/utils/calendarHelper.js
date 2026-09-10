/**
 * Calendar Integration Utilities for Study Streak Rescue
 * Generates direct Google Calendar event URLs and standard .ics files with reminders.
 */

// Format date and time into UTC string: YYYYMMDDTHHmmssZ
const formatGoogleCalendarDate = (dateObj) => {
  return dateObj.toISOString().replace(/-|:|\.\d+/g, '');
};

/**
 * Generate 1-Click Direct Google Calendar Web URL
 */
export const createGoogleCalendarUrl = ({
  title,
  description = '',
  dateStr, // 'YYYY-MM-DD'
  timeStr = '10:00', // 'HH:mm' in 24h format
  durationMinutes = 30,
  subject = 'Study Session',
}) => {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const startDate = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const startIso = formatGoogleCalendarDate(startDate);
    const endIso = formatGoogleCalendarDate(endDate);

    const eventTitle = `[Study Rescue] ${title}`;
    const eventDetails = `${description}\n\n📚 Subject: ${subject}\n⏱️ Estimated Duration: ${durationMinutes} minutes\n🔥 Keep your streak alive! (Study Streak Rescue)`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: eventTitle,
      dates: `${startIso}/${endIso}`,
      details: eventDetails,
      location: subject,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (err) {
    console.error('Error generating Google Calendar URL:', err);
    return 'https://calendar.google.com/';
  }
};

/**
 * Generate iCalendar (.ics) format with 15-minute popup reminders (VALARM)
 */
export const generateIcsCalendar = ({
  planTitle,
  subject,
  tasks = [],
  preferredStartTime = '10:00',
}) => {
  const pad = (n) => String(n).padStart(2, '0');

  const formatIcsDate = (date) => {
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
      date.getUTCHours()
    )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  };

  const nowStr = formatIcsDate(new Date());

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Study Streak Rescue//Study Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Study Streak: ${planTitle}`,
  ];

  const [startHour, startMin] = preferredStartTime.split(':').map(Number);

  tasks.forEach((task, index) => {
    if (!task.scheduledDate) return;

    // Build start date
    const [year, month, day] = task.scheduledDate.split('-').map(Number);
    const taskStartDate = new Date(Date.UTC(year, month - 1, day, startHour, startMin, 0));
    const durationMins = task.estimatedMinutes || 30;
    const taskEndDate = new Date(taskStartDate.getTime() + durationMins * 60 * 1000);

    const uid = `study-streak-${task.id || index}-${nowStr}@studystreakrescue.app`;
    const cleanTitle = (task.title || 'Study Task').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const cleanDesc = `Subject: ${subject}\\nTask: ${task.title}\\nDuration: ${durationMins}m\\nPriority: ${task.priority}\\nStatus: ${task.status}`
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,');

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${formatIcsDate(taskStartDate)}`,
      `DTEND:${formatIcsDate(taskEndDate)}`,
      `SUMMARY:[Study Rescue] ${cleanTitle}`,
      `DESCRIPTION:${cleanDesc}`,
      `CATEGORIES:EDUCATION,STUDY`,
      `STATUS:${task.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`,
      // Add 15-minute popup notification alarm
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: Time to study ${cleanTitle}!`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
};

/**
 * Trigger download of .ics file in browser
 */
export const downloadIcsFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
