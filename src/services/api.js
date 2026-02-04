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

  const dateAfter = todayKyiv
    .minus({ days: 1 })
    .set({ hour: 12, minute: 0, second: 0, millisecond: 0 });

  const dateBefore = todayKyiv.plus({ days: 1 }).startOf('day');

  const toApiTime = (dt) =>
    dt.toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss'+00:00'");

  // Build Query String Manually to preserve 'group[]'
  const params = new URLSearchParams({
    before: toApiTime(dateBefore),
    after: toApiTime(dateAfter),
    'group[]': CONFIG.group,
    time: addressHash,
  });

  // Decode the brackets back to []
  const queryString = params
    .toString()
    .replace(/%5B/g, '[')
    .replace(/%5D/g, ']');

  return {
    url: `${CONFIG.apiUrl}?${queryString}`,
    headers: {
      accept: 'application/ld+json',
      'x-debug-key': debugKey,
      Referer: 'https://poweron.toe.com.ua/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0',
    },
  };
}
