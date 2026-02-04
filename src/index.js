import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initHandlers } from './bot/handlers.js';
import { checkSchedule } from './services/scheduler.js';
import { startServer } from './server.js';

dotenv.config();

const start = async () => {
  await connectDB();

  startServer();
  initHandlers();
  checkSchedule();
  setInterval(checkSchedule, 15 * 60 * 1000); // 15 minutes
};

start();
