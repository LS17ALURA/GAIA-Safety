import 'dotenv/config';
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

const botToken = '7977541204:AAGqBKBRvsaHA5L5NnD_9IN-YU4MOr_-qlc';
const bot = new TelegramBot(botToken, { polling: true });

bot.on('message', (msg) => {
  console.log('Chat ID:', msg.chat.id, ' - Mensagem:', msg.text);
});

app.use(express.json());

let db;

(async () => {
  db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Cria tabelas se não existirem
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ownerName VARCHAR(255) NOT NULL,
      chatId VARCHAR(255) NOT NULL UNIQUE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userChatId VARCHAR(255) NOT NULL,
      contactChatId VARCHAR(255) NOT NULL,
      FOREIGN KEY (userChatId) REFERENCES users(chatId)
    );
  `);
})();

// Comando /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `Bem-vindo! Para registrar, use:\n/register NomeSensor`);
});

// Comando /register NomeSensor
bot.onText(/\/register (.+)/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const ownerName = match[1].trim();
  if (!ownerName) {
    await bot.sendMessage(chatId, 'Use: /register NomeSensor');
    return;
  }
  try {
    await db.execute(
      `INSERT INTO users (ownerName, chatId) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE ownerName = VALUES(ownerName);`,
      [ownerName, chatId]
    );
    await bot.sendMessage(chatId, `Registrado! Sensor: ${ownerName}`);
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    await bot.sendMessage(chatId, 'Erro ao registrar. Tente novamente.');
  }
});

// Comando /addcontact ChatID
bot.onText(/\/addcontact (.+)/, async (msg, match) => {
  const userChatId = msg.chat.id.toString();
  const contactId = match[1].trim();
  try {
    await db.execute(
      `INSERT INTO contacts (userChatId, contactChatId) VALUES (?, ?);`,
      [userChatId, contactId]
    );
    await bot.sendMessage(userChatId, `Contato ${contactId} adicionado!`);
  } catch (error) {
    console.error('Erro ao adicionar contato:', error);
    await bot.sendMessage(userChatId, 'Erro ao adicionar contato. Tente novamente.');
  }
});

// Endpoint POST /alert para ESP
app.post('/alert', async (req, res) => {
  const { sensorOwner, gasLevel } = req.body;
  if (typeof sensorOwner !== 'string' || typeof gasLevel !== 'number') {
    return res.status(400).json({ error: 'Dados insuficientes' });
  }
  try {
    const [rows] = await db.execute(`SELECT chatId FROM users WHERE ownerName = ?`, [sensorOwner]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const [contacts] = await db.execute(`SELECT contactChatId FROM contacts WHERE userChatId = ?`, [user.chatId]);
    const allChats = [user.chatId, ...contacts.map(c => c.contactChatId)];

    console.log(`⭐ Enviando alerta para:`, allChats);
    for (const chatId of allChats) {
      const msg = `🚨 *Alerta de Gás*\nSensor: ${sensorOwner}\nValor: ${gasLevel}%`;
      try {
        await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
        console.log(`✔ Enviado para ${chatId}`);
      } catch (err) {
        console.error(`✖ Falha em ${chatId}:`, err.message);
      }
    }

    res.json({ message: 'Alerta enviado', notified: allChats });
  } catch (error) {
    console.error('Erro no endpoint /alert:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
// This code sets up an Express server with a Telegram bot that allows users to register sensors, add emergency contacts, and receive gas level alerts.
// It uses a MySQL database to store user and contact information, and provides an endpoint for ESP devices to send gas level alerts.
// The bot responds to commands like /start, /register, and /addcontact, and sends alerts to registered users and their contacts when gas levels are reported.
// Make sure to set up your .env file with the correct database credentials before running the server