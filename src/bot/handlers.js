import { bot } from './instance.js';
import { Subscriber } from '../models/Subscriber.js';
import { Schedule } from '../models/Schedule.js';
import { getSchedule } from '../services/api.js';
import { DateTime } from 'luxon';

const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map((id) => Number(id.trim()));

export async function sendScheduleToUser(chatId) {
  let scheduleDoc = await Schedule.findOne();

  const isAdmin = ADMIN_IDS.includes(chatId);
  const isStale = !scheduleDoc || Date.now() - scheduleDoc.lastUpdated > 60000; // 1 minute

  // Use cache by default, UNLESS it's missing OR user is Admin
  let scheduleContent = scheduleDoc ? scheduleDoc.content : null;
  let forceUpdate = false;

  // If user is Admin, fetching fresh data immediately
  if (isAdmin && isStale) {
    console.log(`👮 Admin ${chatId} requested fresh data...`);
    const freshSchedule = await getSchedule();

    // Only update if we actually got data back (avoid overwriting with null on error)
    if (freshSchedule) {
      scheduleContent = freshSchedule;
      forceUpdate = true; // Flag to save to DB later
    }
  }

  // If we still don't have content (Cache miss AND not admin/admin fetch failed), try fetching
  if (!scheduleContent) {
    console.log('⚠️ Cache miss. Fetching from API...');
    scheduleContent = await getSchedule();
    forceUpdate = !!scheduleContent;
  }

  // Save changes to DB if we fetched new data
  if (forceUpdate && scheduleContent) {
    if (scheduleDoc) {
      scheduleDoc.content = scheduleContent;
      scheduleDoc.lastUpdated = new Date();
      await scheduleDoc.save();
    } else {
      scheduleDoc = await Schedule.create({ content: scheduleContent });
    }
  }

  const date = DateTime.now()
    .setZone('Europe/Kyiv')
    .setLocale('uk')
    .toFormat('dd.MM.yyyy');

  // Format the time from the DB (or "Just now" if we just updated it)
  const lastCheckTime = scheduleDoc?.lastUpdated
    ? DateTime.fromJSDate(scheduleDoc.lastUpdated)
        .setZone('Europe/Kyiv')
        .toFormat('HH:mm')
    : DateTime.now().setZone('Europe/Kyiv').toFormat('HH:mm');

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [[{ text: '🔄 Перевірити графік' }]],
      resize_keyboard: true,
    },
  };

  if (scheduleContent) {
    await bot.sendMessage(
      chatId,
      `📅 **Графік на ${date}:**\n(Оновлено: ${lastCheckTime})\n\n${scheduleContent}`,
      options
    );
  } else {
    await bot.sendMessage(
      chatId,
      '⚠️ Не вдалося отримати графік. Спробуйте пізніше.',
      options
    );
  }
}

export function initHandlers() {
  // Command: /start
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const exists = await Subscriber.findOne({ chatId });
      if (!exists) {
        await Subscriber.create({ chatId });
        console.log(`➕ New user: ${chatId}`);
        bot.sendMessage(chatId, '👋 Привіт! Я буду повідомляти вас про зміни.');
      }
      await sendScheduleToUser(chatId);
    } catch (error) {
      console.error('DB Error:', error);
    }
  });

  // Command: /check
  bot.onText(/\/check|🔄 Перевірити графік/, async (msg) => {
    await sendScheduleToUser(msg.chat.id);
  });

  console.log('🤖 Bot handlers loaded.');
}
