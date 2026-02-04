import { bot } from '../bot/instance.js';
import { Subscriber } from '../models/Subscriber.js';
import { Schedule } from '../models/Schedule.js';
import { getSchedule } from './api.js';

export const checkSchedule = async () => {
  try {
    const currentSchedule = await getSchedule();

    // Fetch the last saved schedule from DB
    let dbEntry = await Schedule.findOne();

    // If DB is empty, initialize it without broadcasting (first run)
    if (!dbEntry && currentSchedule) {
      dbEntry = await Schedule.create({ content: currentSchedule });
      console.log('🕞 Initial schedule saved to DB.');
      return;
    }

    // If API failed to return data, stop here to avoid overwriting with null
    if (!currentSchedule) return;

    // Compare API data with DB data
    if (currentSchedule !== dbEntry.content) {
      console.log('📢 Schedule changed! Broadcasting...');

      // Update DB with new schedule
      dbEntry.content = currentSchedule;
      dbEntry.lastUpdated = new Date();
      await dbEntry.save();

      const date = new Date().toLocaleDateString('uk-UA');
      const message = `🔔 **Оновлення на ${date}:**\n\nГрафік змінився:\n\n${currentSchedule}`;

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
      // Update timestamp even if content is same, to show we checked
      dbEntry.lastUpdated = new Date();
      await dbEntry.save();
    }
  } catch (e) {
    console.error('Critical Loop Error:', e);
  }
};
