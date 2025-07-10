import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import mysql from "mysql2/promise";

const app = express();
const PORT = process.env.PORT || 3000;

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true, dropPendingUpdates: true });

bot.on("message", (msg) => {
  console.log("Chat ID:", msg.chat.id, " - Mensagem:", msg.text);
});

app.use(express.json());

let db;

(async () => {
  try {
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
          CREATE TABLE IF NOT EXISTS sensors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chatId VARCHAR(255) NOT NULL,
            name VARCHAR(50) NOT NULL,
            type VARCHAR(20) NOT NULL,
            UNIQUE(chatId, name),
            FOREIGN KEY(chatId) REFERENCES users(chatId)
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

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao conectar no banco:", error);
    process.exit(1);
  }
})();

// Telegram Bot Commands
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Bem-vindo! Para registrar um sensor, use:\n/register Nome Tipo\nExemplo: /register Cozinha gas`,
  );
});

bot.onText(/\/register (\w+)\s+(\w+)/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const name = match[1].trim();
  const type = match[2].trim().toLowerCase();

  const tiposValidos = ["gas", "fumaça", "incendio"];
  if (!tiposValidos.includes(type)) {
    return bot.sendMessage(
      chatId,
      "Tipo inválido. Use: gas, fumaça ou incendio.",
    );
  }

  try {
    await db.execute(
      `INSERT INTO sensors (chatId, name, type) VALUES (?, ?, ?)`,
      [chatId, name, type],
    );
    await bot.sendMessage(
      chatId,
      `Sensor '${name}' (${type}) registrado com sucesso.`,
    );
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      await bot.sendMessage(
        chatId,
        `Você já tem um sensor com o nome '${name}'. Use um nome diferente.`,
      );
    } else {
      console.error(err);
      await bot.sendMessage(chatId, "Erro ao registrar sensor.");
    }
  }
});

bot.onText(/\/addcontact (.+)/, async (msg, match) => {
  const userChatId = msg.chat.id.toString();
  const contactId = match[1].trim();
  try {
    await db.execute(
      `INSERT INTO contacts (userChatId, contactChatId) VALUES (?, ?)`,
      [userChatId, contactId],
    );
    await bot.sendMessage(userChatId, `Contato ${contactId} adicionado!`);
  } catch (error) {
    console.error("Erro ao adicionar contato:", error);
    await bot.sendMessage(
      userChatId,
      "Erro ao adicionar contato. Tente novamente.",
    );
  }
});

app.post("/alert", async (req, res) => {
  const { sensorOwner, sensorName, type, value } = req.body;
  if (
    typeof sensorOwner !== "string" ||
    typeof sensorName !== "string" ||
    typeof type !== "string" ||
    typeof value !== "number"
  ) {
    return res.status(400).json({ error: "Dados insuficientes ou inválidos" });
  }

  try {
    // Busca sensor pelo chatId do dono, nome e tipo
    const [sensors] = await db.execute(
      `SELECT s.chatId FROM sensors s JOIN users u ON s.chatId = u.chatId WHERE u.ownerName = ? AND s.name = ? AND s.type = ?`,
      [sensorOwner, sensorName, type],
    );
    if (sensors.length === 0) {
      return res.status(404).json({ error: "Sensor não encontrado" });
    }
    const userChatId = sensors[0].chatId;

    // Busca contatos
    const [contacts] = await db.execute(
      `SELECT contactChatId FROM contacts WHERE userChatId = ?`,
      [userChatId],
    );
    const allChats = [userChatId, ...contacts.map((c) => c.contactChatId)];

    // Envia mensagem para todos
    const msg = `🚨 *Alerta de ${type}*\nSensor: ${sensorName}\nValor: ${value}`;
    for (const chatId of allChats) {
      try {
        await bot.sendMessage(chatId, msg, { parse_mode: "Markdown" });
        console.log(`✔ Enviado para ${chatId}`);
      } catch (err) {
        console.error(`✖ Falha em ${chatId}:`, err.message);
      }
    }

    res.json({ message: "Alerta enviado", notified: allChats });
  } catch (error) {
    console.error("Erro no endpoint /alert:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
