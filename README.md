# Ternopil Power Schedule Bot (Group 5.2)

A Node.js Telegram bot that monitors electricity outage schedules for Group 5.2 in Ternopil. It polls the regional provider's API every 15 minutes and broadcasts updates to subscribers when the schedule changes.

## Features

- **Automated Monitoring:** Checks for updates every 15 minutes.
- **State Diffing:** Only sends notifications if the schedule actually changes.
- **Persistence:** Stores subscriber Chat IDs in MongoDB.
- **Manual Check:** Users can request the current status via a menu button.

## Setup

1.  **Clone and Install**

    ```bash
    git clone https://github.com/OleksandrZadvornyi/ternopil-light-bot
    cd ternopil-light-bot
    npm install
    ```

2.  **Configuration**
    Create a `.env` file in the root directory:

    ```env
    TELEGRAM_BOT_TOKEN=your_telegram_token
    MONGODB_URI=your_mongodb_connection_string
    ```

3.  **Run**
    ```bash
    node index.js
    ```

## ⚠️ Disclaimer

This project is for **educational and non-commercial purposes only**.
The data is retrieved from public sources provided by the regional energy provider.
This bot is not affiliated with, endorsed by, or connected to the official service provider.
The developer is not responsible for any inaccuracies in the schedule.
