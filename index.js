import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import express from 'express';
import { getSchedule } from './api.js';

dotenv.config();

// --- CONFIGURATION ---
const token = process.env.TELEGRAM_BOT_TOKEN;
const mongoUri = process.env.MONGODB_URI;

if (!token || !mongoUri) {
  console.error('❌ Error: Missing TELEGRAM_BOT_TOKEN or MONGODB_URI in .env');
  process.exit(1);
}

// --- DATABASE SETUP ---
mongoose
  .connect(mongoUri)
  .then(() => console.log('🍃 Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Define the Schema (Table structure)
const subscriberSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, unique: true },
  joinedAt: { type: Date, default: Date.now },
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// --- BOT SETUP ---
const bot = new TelegramBot(token, { polling: true });
let lastSchedule = '';

// --- WEB SERVER (For Render "Keep-Alive") ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running...');
});

app.listen(PORT, () => {
  console.log(`🌍 Web server listening on port ${PORT}`);
});

// --- COMMAND HANDLERS ---

// 0. Set the Menu Button (Runs on startup)
bot.setMyCommands([
  { command: '/start', description: 'Підписатися та перезапустити' },
  { command: '/check', description: 'Перевірити статус вручну' },
]);

// 1. /start - Subscribe User & Show Keyboard
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Define the custom keyboard
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [[{ text: '🔄 Перевірити графік' }]],
      resize_keyboard: true,
      is_persistent: true,
    },
  };

  try {
    const exists = await Subscriber.findOne({ chatId });

    if (!exists) {
      await Subscriber.create({ chatId });
      console.log(`➕ New user subscribed: ${chatId}`);
      bot.sendMessage(
        chatId,
        '👋 Привіт! Я буду повідомляти вас про зміни в графіку відключень світла в Тернополі.'
      );
    } else {
      bot.sendMessage(chatId, 'Ви вже підписані. ✅', options);
    }

    // Send data immediately
    await sendScheduleToUser(chatId);
  } catch (error) {
    console.error('Database Error:', error);
    bot.sendMessage(chatId, '⚠️ Внутрішня помилка. Спробуйте ще раз.');
  }
});

// 2. Handle Button Press OR /check command
// This Regex matches either the command "/check" OR the button text "🔄 Перевірити графік"
bot.onText(/\/check|🔄 Перевірити графік/, async (msg) => {
  const chatId = msg.chat.id;

  // Feedback to let user know it's working
  bot.sendChatAction(chatId, 'typing');

  await sendScheduleToUser(chatId);
});

// Helper: Fetch and send schedule to a specific user
async function sendScheduleToUser(chatId) {
  const schedule = await getSchedule();
  const date = new Date().toLocaleDateString('uk-UA');

  // We repeat the keyboard options here to ensure it doesn't disappear
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [[{ text: '🔄 Перевірити графік' }]],
      resize_keyboard: true,
    },
  };

  if (schedule) {
    bot.sendMessage(
      chatId,
      `📅 **Графік на ${date}:**\n\n${schedule}`,
      options
    );
  } else {
    bot.sendMessage(
      chatId,
      '⚠️ Не вдалося отримати графік. Спробуйте пізніше.',
      options
    );
  }
}

// --- POLLING LOOP ---
const adminChatId = process.env.ADMIN_CHAT_ID;

const checkSchedule = async () => {
  try {
    const currentSchedule = await getSchedule();
    if (!currentSchedule) {
      console.error('❌ API Fetch failed.');
      if (adminChatId) {
        bot.sendMessage(
          adminChatId,
          '⚠️ **ALERT:** The Bot cannot fetch data! The API URL might have changed.'
        );
      }
      return;
    }

    // Initialization check
    if (lastSchedule === '') {
      lastSchedule = currentSchedule;
      console.log('✅ Initial schedule saved (no broadcast).');
      return;
    }

    // Diffing check
    if (currentSchedule !== lastSchedule) {
      console.log('🔄 Schedule changed! Broadcasting...');
      lastSchedule = currentSchedule;

      const date = new Date().toLocaleDateString('uk-UA');
      const message = `🔔 **Оновлення на ${date}:**\n\nГрафік змінився:\n\n${currentSchedule}`;

      // Fetch all users from MongoDB
      const subscribers = await Subscriber.find({});

      for (const sub of subscribers) {
        try {
          await bot.sendMessage(sub.chatId, message, {
            parse_mode: 'Markdown',
          });
        } catch (error) {
          // Handle blocked users
          if (error.response && error.response.statusCode === 403) {
            console.log(`❌ User ${sub.chatId} blocked bot. Removing from DB.`);
            await Subscriber.deleteOne({ chatId: sub.chatId });
          } else {
            console.error(`Failed to send to ${sub.chatId}:`, error.message);
          }
        }
      }
    } else {
      console.log('No changes detected.');
    }
  } catch (e) {
    console.error('Critical Loop Error:', e);
  }
};

// Start the polling loop (15 minutes)
checkSchedule();
setInterval(checkSchedule, 15 * 60 * 1000);

console.log('🤖 Bot is running...');
