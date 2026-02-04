import dotenv from 'dotenv';
import { parseSchedule } from '../utils/parser.js';

dotenv.config();

const CONFIG = {
  cityId: '1032',
  streetId: '11101',
  house: '10',
  group: '5.2',
  apiUrl: process.env.API_URL,
};

export async function getSchedule() {
  try {
    const { url, headers } = buildRequestConfig();

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

  const today = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Kyiv' })
  );
  const dateStart = new Date(today.setHours(0, 0, 0, 0));
  const dateEnd = new Date(today.setHours(23, 59, 59, 999));

  const params = new URLSearchParams({
    before: dateEnd.toISOString(),
    after: dateStart.toISOString(),
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
