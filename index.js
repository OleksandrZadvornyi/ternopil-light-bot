import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { getSchedule } from './api.js';

dotenv.config();

// 1. Initialize Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is missing in .env file.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// 2. State Management
// Using a Set to ensure unique Chat IDs
const subscribers = new Set();
let lastSchedule = '';

// 3. Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Add user to subscribers list
  if (!subscribers.has(chatId)) {
    subscribers.add(chatId);
    console.log(`➕ New user subscribed: ${chatId}`);
    bot.sendMessage(
      chatId,
      '👋 Привіт! Я буду повідомляти вас про зміни в графіку відключень світла в Тернополі.'
    );
  } else {
    bot.sendMessage(chatId, 'Ви вже підписані. ✅');
  }

  // Send current schedule immediately so they don't have to wait
  bot.sendChatAction(chatId, 'typing');
  const schedule = await getSchedule();

  if (schedule) {
    bot.sendMessage(chatId, `📅 **Поточний графік:**\n\n${schedule}`, {
      parse_mode: 'Markdown',
    });
  } else {
    bot.sendMessage(
      chatId,
      '⚠️ Не вдалося отримати графік прямо зараз. Я продовжуватиму спроби!'
    );
  }
});

// 4. Polling Function
const checkSchedule = async () => {
  console.log(`⏰ Checking schedule at ${new Date().toLocaleTimeString()}...`);

  const currentSchedule = await getSchedule();

  // If API failed, stop here
  if (!currentSchedule) return;

  // INITIALIZATION: If this is the first run, just save the state, don't spam.
  if (lastSchedule === '') {
    lastSchedule = currentSchedule;
    console.log('✅ Initial schedule saved.');
    return;
  }

  // DIFFING: Compare new schedule vs old schedule
  if (currentSchedule !== lastSchedule) {
    console.log('🔄 Schedule changed! Broadcasting...');

    lastSchedule = currentSchedule; // Update state

    // Broadcast to all subscribers
    const message = `🔔 **Оновлення! Графік змінився:**\n\n${currentSchedule}`;

    for (const chatId of subscribers) {
      try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        // If a user blocked the bot, remove them
        if (error.response && error.response.statusCode === 403) {
          console.log(`❌ User ${chatId} blocked bot. Removing.`);
          subscribers.delete(chatId);
        } else {
          console.error(`Failed to send to ${chatId}:`, error.message);
        }
      }
    }
  } else {
    console.log('No changes detected.');
  }
};

// 5. Start the Loop
// Run immediately on startup (optional, currently strictly scheduled)
checkSchedule();

// Schedule every 15 minutes (15 * 60 * 1000 ms)
const INTERVAL_MINUTES = 15;
setInterval(checkSchedule, INTERVAL_MINUTES * 60 * 1000);

console.log('🤖 Bot is running...');
