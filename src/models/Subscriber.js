import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, unique: true },
  joinedAt: { type: Date, default: Date.now },
});

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);
