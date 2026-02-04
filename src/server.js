import express from 'express';

export const startServer = () => {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/', (_, res) => res.send('🤖 Bot is running...'));

  app.listen(PORT, () => {
    console.log(`🌍 Web server listening on port ${PORT}`);
  });
};
