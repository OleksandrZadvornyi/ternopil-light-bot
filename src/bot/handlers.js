import { bot } from './instance.js';
import { Subscriber } from '../models/Subscriber.js';
import { Schedule } from '../models/Schedule.js';
import { getSchedule } from '../services/api.js';
import { DateTime } from 'luxon';

export async function sendScheduleToUser(chatId) {
  let scheduleDoc = await Schedule.findOne();
  let scheduleContent = scheduleDoc ? scheduleDoc.content : null;

  if (!scheduleContent) {
    console.log('⚠️ Cache miss. Fetching from API...');
    scheduleContent = await getSchedule();
    if (scheduleContent) {
      await Schedule.create({ content: scheduleContent });
    }
  }

  const date = DateTime.now()
    .setZone('Europe/Kyiv')
    .setLocale('uk')
    .toFormat('dd.MM.yyyy');

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
      `📅 **Графік на ${date}:**\n\n${scheduleContent}`,
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
