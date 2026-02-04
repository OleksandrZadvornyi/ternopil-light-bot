import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  content: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export const Schedule = mongoose.model('Schedule', scheduleSchema);
