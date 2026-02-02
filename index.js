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

// 1. /start - Subscribe User
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Try to add user to DB. If they exist, this does nothing (idempotent)
    const exists = await Subscriber.findOne({ chatId });

    if (!exists) {
      await Subscriber.create({ chatId });
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
  } catch (error) {
    console.error('Database Error:', error);
    bot.sendMessage(chatId, '⚠️ Внутрішня помилка. Спробуйте ще раз.');
  }
});

// 2. /check - Manual trigger
bot.onText(/\/check/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🔍 Перевірка актуальних даних...');
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
  if (!currentSchedule) return;

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
    const message = `🔔 **Update for ${date}:**\n\nThe schedule has changed:\n\n${currentSchedule}`;

    // Fetch all users from MongoDB
    const subscribers = await Subscriber.find({});

    for (const sub of subscribers) {
      try {
        await bot.sendMessage(sub.chatId, message, { parse_mode: 'Markdown' });
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
};

// Start the polling loop (15 minutes)
checkSchedule();
setInterval(checkSchedule, 15 * 60 * 1000);

console.log('🤖 Bot is running with MongoDB...');
