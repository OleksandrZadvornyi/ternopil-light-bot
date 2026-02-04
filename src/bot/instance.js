import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ Error: Missing TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

await bot.setMyCommands([{ command: 'start', description: 'Показати кнопки' }]);
