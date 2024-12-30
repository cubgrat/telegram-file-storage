const express = require('express');
const axios = require("axios");
const bodyParser = require('body-parser');
const cors = require('cors'); // Импортируем cors
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  user: 'telegram_user',
  host: 'localhost',
  database: 'telegram_db',
  password: 'telegram_password',
  port: 5432,
});

app.use(cors({
    origin: 'http://localhost:3000', // Разрешить только этот источник
  }));
app.use(bodyParser.json());

app.get("/download", async (req, res) => {
    const { url, name } = req.query;
  
    if (!url) {
      return res.status(400).send("URL не указан.");
    }
  
    try {
      // Загрузка файла с Telegram API
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream", // Загрузка данных в виде потока
      });
  
      // Установка имени файла и отправка файла клиенту
      res.setHeader("Content-Disposition", `attachment; filename="${'file'}"`);
      response.data.pipe(res); // Передача файла клиенту
    } catch (error) {
      console.error("Ошибка загрузки файла через прокси:", error.message);
      res.status(500).send("Ошибка загрузки файла.");
    }
  });

// Ваши маршруты...
app.post('/api/files', async (req, res) => {
    console.log("Тело запроса:", req.body); // Логируем тело запроса
  
    const { chat_id, file_name, file_url } = req.body;
  
    if (!chat_id || !file_name || !file_url) {
      console.error("Некорректные данные:", { chat_id, file_name, file_url });
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
  
    try {
      const result = await pool.query(
        'INSERT INTO uploaded_files (chat_id, file_name, file_url) VALUES ($1, $2, $3) RETURNING *',
        [chat_id, file_name, file_url]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Ошибка сохранения файла:", error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

app.get('/api/files/:chat_id', async (req, res) => {
  const { chat_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM uploaded_files WHERE chat_id = $1 ORDER BY uploaded_at DESC',
      [chat_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения файлов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
