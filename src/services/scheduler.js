import { bot } from '../bot/instance.js';
import { Subscriber } from '../models/Subscriber.js';
import { Schedule } from '../models/Schedule.js';
import { getSchedule } from './api.js';
import { DateTime } from 'luxon';

export const checkSchedule = async () => {
  try {
    const currentSchedule = await getSchedule();
    let dbEntry = await Schedule.findOne();

    if (!dbEntry && currentSchedule) {
      dbEntry = await Schedule.create({ content: currentSchedule });
      console.log('🕞 Initial schedule saved to DB.');
      return;
    }

    // If API failed to return data, stop here to avoid overwriting with null
    if (!currentSchedule) return;

    if (currentSchedule !== dbEntry.content) {
      console.log('📢 Schedule changed! Broadcasting...');

      dbEntry.content = currentSchedule;
      dbEntry.lastUpdated = new Date();
      await dbEntry.save();

      // Get current time for the broadcast message
      const now = DateTime.now().setZone('Europe/Kyiv').setLocale('uk');
      const date = now.toFormat('dd.MM.yyyy');
      const time = now.toFormat('HH:mm');

      const message = `🔔 **Оновлення на ${date}:**\n(Зміни виявлено о ${time})\n\nГрафік змінився:\n\n${currentSchedule}`;

      // Broadcast
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
    } else {
      // Ensure the timestamp stays fresh for manual /check commands
      dbEntry.lastUpdated = new Date();
      await dbEntry.save();
    }
  } catch (e) {
    console.error('Critical Loop Error:', e);
  }
};
