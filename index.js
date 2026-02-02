import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import { getSchedule } from './api.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is missing in .env file.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// --- PERSISTENCE SETUP ---
const DATA_FILE = 'subscribers.json';
let subscribers = new Set();

// Load subscribers from file on startup
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    subscribers = new Set(JSON.parse(data));
    console.log(`📂 Loaded ${subscribers.size} subscribers from file.`);
  } catch (err) {
    console.error('⚠️ Error loading subscribers file:', err);
  }
}

// Helper: Save current subscribers to file
const saveSubscribers = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify([...subscribers]));
  } catch (err) {
    console.error('⚠️ Error saving subscribers:', err);
  }
};

let lastSchedule = '';

// --- COMMAND HANDLERS ---

// 1. /start - Subscribe and get initial data
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Add user to subscribers list
  if (!subscribers.has(chatId)) {
    subscribers.add(chatId);
    saveSubscribers();
    console.log(`➕ New user subscribed: ${chatId}`);
    bot.sendMessage(
      chatId,
      '👋 Привіт! Я буду повідомляти вас про зміни в графіку відключень світла в Тернополі.'
    );
  } else {
    bot.sendMessage(chatId, 'Ви вже підписані. ✅');
  }

  // Send data immediately
  await sendScheduleToUser(chatId);
});

// 2. /check - Manual trigger
bot.onText(/\/check/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🔍 Перевіряю актуальні дані... ');
  await sendScheduleToUser(chatId);
});

// Helper: Fetch and send schedule to a specific user
async function sendScheduleToUser(chatId) {
  const schedule = await getSchedule();
  const date = new Date().toLocaleDateString('uk-UA');

  if (schedule) {
    bot.sendMessage(chatId, `📅 **Графік на ${date}:**\n\n${schedule}`, {
      parse_mode: 'Markdown',
    });
  } else {
    bot.sendMessage(
      chatId,
      '⚠️ Не вдалося отримати графік. Спробуйте пізніше.'
    );
  }
}

// --- POLLING LOOP ---

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

  // Diffing check
  if (currentSchedule !== lastSchedule) {
    console.log('🔄 Schedule changed! Broadcasting...');
    lastSchedule = currentSchedule;

    const date = new Date().toLocaleDateString('uk-UA');
    const message = `🔔 **Оновлення на ${date}:**\n\nГрафік змінився:\n\n${currentSchedule}`;

    for (const chatId of subscribers) {
      try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        if (error.response && error.response.statusCode === 403) {
          console.log(`❌ User ${chatId} blocked bot. Removing.`);
          subscribers.delete(chatId);
          saveSubscribers(); // Update file
        } else {
          console.error(`Failed to send to ${chatId}:`, error.message);
        }
      }
    }
  } else {
    console.log('No changes detected.');
  }
};

// Schedule every 15 minutes (15 * 60 * 1000 ms)
checkSchedule();
setInterval(checkSchedule, 15 * 60 * 1000); // 15 Minutes

console.log('🤖 Bot is running...');
