import { bot } from '../bot/instance.js';
import { Subscriber } from '../models/Subscriber.js';
import { getSchedule } from './api.js';

let lastSchedule = '';

export const checkSchedule = async () => {
  try {
    const currentSchedule = await getSchedule();

    if (lastSchedule === '') {
      lastSchedule = currentSchedule;
      console.log('✅ Initial schedule saved.');
      return;
    }

    if (currentSchedule !== lastSchedule) {
      console.log('🔄 Schedule changed! Broadcasting...');
      lastSchedule = currentSchedule;
      const date = new Date().toLocaleDateString('uk-UA');
      const message = `🔔 **Оновлення на ${date}:**\n\nГрафік змінився:\n\n${currentSchedule}`;

      const subscribers = await Subscriber.find({});
      for (const sub of subscribers) {
        try {
          await bot.sendMessage(sub.chatId, message, {
            parse_mode: 'Markdown',
          });
        } catch (error) {
          if (error.response && error.response.statusCode === 403) {
            await Subscriber.deleteOne({ chatId: sub.chatId });
          }
        }
      }
    }
  } catch (e) {
    console.error('Critical Loop Error:', e);
  }
};
