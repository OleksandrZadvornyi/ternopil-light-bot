import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  cityId: '1032',
  streetId: '11101',
  house: '10',
  group: '5.2',
};

export async function getSchedule() {
  const addressHash = `${CONFIG.cityId}${CONFIG.streetId}${CONFIG.house}`;

  const now = new Date();
  const today = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Kyiv' })
  );

  // Set explicit time boundaries
  const dateStart = new Date(today);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(today);
  dateEnd.setHours(23, 59, 59, 999);

  const params = new URLSearchParams({
    before: dateEnd.toISOString(),
    after: dateStart.toISOString(),
    'group[]': CONFIG.group,
    time: addressHash,
  });

  const url = `${process.env.API_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/ld+json',
        'x-debug-key': 'MTAzMi8xMTEwMS8xMA==', // Base64 '1032/11101/10'
        Referer: 'https://poweron.toe.com.ua/',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const member = data['hydra:member']?.[0];

    if (!member || !member.dataJson || !member.dataJson[CONFIG.group]) {
      throw new Error('Invalid API structure or data missing');
    }

    const times = member.dataJson[CONFIG.group].times;
    return parseSchedule(times);
  } catch (error) {
    console.error('Fetch error:', error.message);
    return null; // Return null to indicate failure
  }
}

// Helper: Parse the times object into a string
function parseSchedule(times) {
  const sortedTimes = Object.keys(times).sort();
  let outageStart = null;
  let lastTime = null;
  let scheduleLines = [];

  const add30Min = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + 30);
    return date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  sortedTimes.forEach((time) => {
    const status = times[time];
    // 1 = Off, 10 = Possible/Grey. Both treated as OFF.
    const isOff = status === '1' || status === '10';

    if (isOff) {
      if (!outageStart) outageStart = time;
      lastTime = time;
    } else {
      if (outageStart) {
        const endTime = add30Min(lastTime);
        scheduleLines.push(`🔴 ${outageStart} - ${endTime}`);
        outageStart = null;
      }
    }
  });

  // Handle end of day outage
  if (outageStart) {
    const endTime = add30Min(lastTime);
    scheduleLines.push(`🔴 ${outageStart} - ${endTime}`);
  }

  if (scheduleLines.length === 0) {
    return '✅ Світло увімкнено весь день (графік порожній).';
  }

  return scheduleLines.join('\n');
}
