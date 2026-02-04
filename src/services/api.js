import dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { parseSchedule } from '../utils/parser.js';

dotenv.config();

const CONFIG = {
  cityId: process.env.CITY_ID,
  streetId: process.env.STREET_ID,
  house: process.env.HOUSE_ID,
  group: process.env.GROUP,
  apiUrl: process.env.API_URL,
};

export async function getSchedule() {
  try {
    const { url, headers } = buildRequestConfig();

    console.log('🔍 Debug URL:', url);
    console.log('🔍 Debug Headers:', JSON.stringify(headers));

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const times = data['hydra:member']?.[0]?.dataJson?.[CONFIG.group]?.times;

    if (!times) throw new Error('Data missing for this group');

    return parseSchedule(times);
  } catch (error) {
    console.error('Fetch error:', error.message);
    return null;
  }
}

function buildRequestConfig() {
  const addressHash = `${CONFIG.cityId}${CONFIG.streetId}${CONFIG.house}`;
  const debugKey = Buffer.from(
    `${CONFIG.cityId}/${CONFIG.streetId}/${CONFIG.house}`
  ).toString('base64');

  // Explicitly define "Now" in Kyiv timezone
  const todayKyiv = DateTime.now().setZone('Europe/Kyiv');

  // Get start/end of the day in Kyiv, then convert to UTC ISO strings for the API
  const dateStart = todayKyiv.startOf('day');
  const dateEnd = todayKyiv.endOf('day');

  const params = new URLSearchParams({
    before: dateEnd.toJSDate().toISOString(),
    after: dateStart.toJSDate().toISOString(),
    'group[]': CONFIG.group,
    time: addressHash,
  });

  return {
    url: `${CONFIG.apiUrl}?${params}`,
    headers: {
      accept: 'application/ld+json',
      'x-debug-key': debugKey,
      Referer: 'https://poweron.toe.com.ua/',
      'User-Agent': 'Mozilla/5.0',
    },
  };
}
