// ver-dados.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

(async () => {
  const db = await open({
    filename: './data.db',
    driver: sqlite3.Database
  });

  console.log('\n📋 Lista de usuários registrados:\n');
  const users = await db.all('SELECT * FROM users');
  users.forEach(user => {
    console.log(`• ID: ${user.id}, Nome: ${user.ownerName}, ChatID: ${user.chatId}`);
  });

  console.log('\n👥 Contatos de emergência:\n');
  const contacts = await db.all('SELECT * FROM contacts');
  contacts.forEach(c => {
    console.log(`• Usuário: ${c.userChatId} → Contato: ${c.contactChatId}`);
  });

  await db.close();
})();
// This script connects to the SQLite database and retrieves all registered users and their emergency contacts.
// It prints the user ID, owner name, and chat ID for each user, as well as the user chat ID and contact chat ID for each emergency contact.
// Make sure to run this script after the bot has been used to register users and add contacts
