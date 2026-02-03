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

  const debugString = `${CONFIG.cityId}/${CONFIG.streetId}/${CONFIG.house}`;
  const debugKey = Buffer.from(debugString).toString('base64');

  const kyivTime = new Date().toLocaleString('en-US', {
    timeZone: 'Europe/Kyiv',
  });
  const today = new Date(kyivTime);

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
        'x-debug-key': debugKey,
        Referer: 'https://poweron.toe.com.ua/',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const member = data['hydra:member']?.[0];

    const times = member?.dataJson?.[CONFIG.group]?.times;

    if (!times) {
      throw new Error('Invalid API structure or data missing for this group');
    }

    return parseSchedule(times);
  } catch (error) {
    console.error('Fetch error:', error.message);
    return null;
  }
}

function parseSchedule(times) {
  const sortedTimes = Object.keys(times).sort();
  let outageStart = null;
  let lastTime = null;
  let scheduleLines = [];

  const getEndTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = h * 60 + m + 30;

    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;

    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  sortedTimes.forEach((time) => {
    const status = times[time];
    // 1 = Off, 10 = Possible. Both treated as OFF.
    const isOff = status === '1' || status === '10';

    if (isOff) {
      if (!outageStart) outageStart = time;
      lastTime = time;
    } else {
      if (outageStart) {
        scheduleLines.push(`🔴 ${outageStart} - ${getEndTime(lastTime)}`);
        outageStart = null;
      }
    }
  });

  if (outageStart) {
    scheduleLines.push(`🔴 ${outageStart} - ${getEndTime(lastTime)}`);
  }

  if (scheduleLines.length === 0) {
    return '✅ Світло увімкнено весь день (графік порожній).';
  }

  return scheduleLines.join('\n');
}
