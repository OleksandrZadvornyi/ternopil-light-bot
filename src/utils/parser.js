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

// Helper for time math
function add30Minutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + 30);

  // Format back to HH:MM
  return date.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
