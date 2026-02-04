import { DateTime } from 'luxon';

/**
 * Takes raw API times and returns a formatted string.
 */
export function parseSchedule(times) {
  if (!times) return null;

  const sortedTimes = Object.keys(times).sort();
  let outageStart = null;
  let lastTime = null;
  let scheduleLines = [];

  sortedTimes.forEach((time) => {
    const status = times[time];
    const isOff = status === '1' || status === '10'; // 1=Off, 10=Possible

    if (isOff) {
      if (!outageStart) outageStart = time;
      lastTime = time;
    } else {
      if (outageStart) {
        scheduleLines.push(`🔴 ${outageStart} - ${add30Minutes(lastTime)}`);
        outageStart = null;
      }
    }
  });

  // Handle case where outage goes until the end of the list
  if (outageStart) {
    scheduleLines.push(`🔴 ${outageStart} - ${add30Minutes(lastTime)}`);
  }

  if (scheduleLines.length === 0) {
    return '✅ Світло увімкнено весь день (графік порожній).';
  }

  return scheduleLines.join('\n');
}

// Helper for time math using Luxon
function add30Minutes(timeStr) {
  // Parse "HH:mm" in Kyiv context
  const time = DateTime.fromFormat(timeStr, 'HH:mm', { zone: 'Europe/Kyiv' });

  // Add 30 minutes and format back
  return time.plus({ minutes: 30 }).toFormat('HH:mm');
}
