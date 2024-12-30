import axios from "axios";

const TELEGRAM_BOT_TOKEN = "7875474514:AAFJEPN-DcPSbeubhb7HLy6wlbDpZ4Cjnpk";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Отправить сообщение
export const sendMessage = async (chatId, text) => {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка отправки сообщения:", error);
    throw error;
  }
};

export const sendFile = async (chatId, file, onProgress) => {
    try {
      // Создаем FormData для загрузки файла
      const formData = new FormData();
      formData.append("document", file);
  
      // Загружаем файл на сервер Telegram
      const telegramResponse = await fetch(
        `${TELEGRAM_API_URL}/sendDocument?chat_id=${chatId}`,
        {
          method: "POST",
          body: formData,
        }
      );
  
      if (!telegramResponse.ok) {
        throw new Error("Ошибка загрузки файла в Telegram API");
      }
  
      const telegramResult = await telegramResponse.json();
      console.log("Ответ Telegram API:", telegramResult);
  
      // Получаем URL файла из ответа Telegram API
      const fileId = telegramResult.result.document.file_id;
      const filePathResponse = await fetch(
        `${TELEGRAM_API_URL}/getFile?file_id=${fileId}`
      );
  
      const filePathResult = await filePathResponse.json();
      console.log("Ответ Telegram getFile API:", filePathResult);
  
      // Проверяем наличие file_path
      if (!filePathResult.ok || !filePathResult.result || !filePathResult.result.file_path) {
        throw new Error("Не удалось получить путь к файлу. Возможно, файл слишком большой.");
      }
  
      const filePath = filePathResult.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
  
      // Отправляем данные о файле на сервер
      const response = await fetch("http://localhost:5000/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          file_name: file.name,
          file_url: fileUrl, // Проверяем, чтобы file_url был валидным
        }),
      });
  
      if (!response.ok) {
        throw new Error("Ошибка при отправке данных о файле на сервер");
      }
  
      return await response.json();
    } catch (error) {
      console.error("Ошибка в sendFile:", error.message);
      throw error;
    }
  };

// Получить список загруженных файлов
export async function getUploadedFiles(chatId) {
    try {
      const dbResponse = await fetch(`http://localhost:5000/api/files/${chatId}`);
      if (!dbResponse.ok) {
        throw new Error("Ошибка при запросе файлов из базы данных");
      }
      const dbFiles = await dbResponse.json();
  
      const dbAdaptedFiles = dbFiles.map((file) => ({
        name: file.file_name,
        url: file.file_url,
      }));
  
      const updatesResponse = await fetch(
        `${TELEGRAM_API_URL}/getUpdates`
      );
      if (!updatesResponse.ok) {
        throw new Error("Ошибка при вызове getUpdates");
      }
  
      const updatesData = await updatesResponse.json();
      if (!updatesData.ok || !updatesData.result || updatesData.result.length === 0) {
        return dbAdaptedFiles; // Возвращаем только файлы из БД, если обновлений нет
      }
  
      const telegramFiles = updatesData.result
        .filter((update) => {
          const chatMatch =
            update.message &&
            update.message.chat &&
            update.message.chat.id.toString() === chatId.toString();
          const hasMedia =
            update.message.document || update.message.photo || update.message.video;
          return chatMatch && hasMedia;
        })
        .map((update) => {
          if (update.message.document) {
            const file = update.message.document;
            return {
              name: file.file_name,
              fileId: file.file_id,
            };
          } else if (update.message.photo) {
            const photo = update.message.photo.pop();
            return {
              name: "photo.jpg",
              fileId: photo.file_id,
            };
          } else if (update.message.video) {
            const video = update.message.video;
            return {
              name: video.file_name || "video.mp4",
              fileId: video.file_id,
            };
          }
        });
  
        const telegramFileLinks = await Promise.all(
            telegramFiles.map(async (file) => {
              try {
                const fileResponse = await fetch(
                  `${TELEGRAM_API_URL}/getFile?file_id=${file.fileId}`
                );
          
                const fileData = await fileResponse.json();
                console.log(`Ответ Telegram API для файла "${file.name}":`, fileData);
          
                if (!fileData.ok) {
                  // Обработка ошибок API Telegram
                  const errorDescription = fileData.description || "Неизвестная ошибка";
                  if (errorDescription.includes("file is too big")) {
                    console.warn(`Файл "${file.name}" пропущен, так как он слишком большой.`);
                    return {
                      name: file.name,
                      url: null, // Указываем, что URL недоступен из-за размера
                      error: "Файл слишком большой для скачивания через Telegram API.",
                    };
                  } else {
                    throw new Error(errorDescription);
                  }
                }
          
                if (!fileData.result || !fileData.result.file_path) {
                  throw new Error("Ошибка: не удалось получить путь к файлу.");
                }
          
                return {
                  name: file.name,
                  url: `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`,
                };
              } catch (error) {
                console.error(`Ошибка при обработке файла "${file.name}":`, error.message);
                return {
                  name: file.name,
                  url: null,
                  error: error.message,
                }; // Возвращаем объект с ошибкой
              }
            })
          );
          
  
      // Фильтруем файлы: убираем null
      const allFiles = [
        ...dbAdaptedFiles,
        ...telegramFileLinks.filter((file) => file !== null),
      ];
  
      console.log("Общий список файлов:", allFiles);
  
      return allFiles;
    } catch (error) {
      console.error("Ошибка при получении файлов:", error);
      throw error;
    }
  }
  