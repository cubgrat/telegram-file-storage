import React, { useState, useEffect } from "react";
import { sendMessage, sendFile, getUploadedFiles } from "./api";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Stack,
  CssBaseline,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  LinearProgress,
  Grid,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "./theme";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import FileTile from "./FileTile";

function App() {
  const [themeMode, setThemeMode] = useState("light");
  const [chatId, setChatId] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, severity: "success", message: "" });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const proxyUrl = `http://localhost:5000/download?url=${encodeURIComponent(fileUrl)}&name=${fileName}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Ошибка загрузки файла");

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Ошибка скачивания файла:", error);
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchUploadedFiles();
    }
  }, [chatId]);

  const fetchUploadedFiles = async () => {
    if (!chatId) {
      setSnackbar({ open: true, severity: "warning", message: "Chat ID обязателен для обновления списка." });
      return;
    }

    try {
      const files = await getUploadedFiles(chatId);
      setUploadedFiles(files);
    } catch (error) {
      console.error("Ошибка получения списка файлов:", error);
      setSnackbar({ open: true, severity: "error", message: "Ошибка получения списка файлов." });
    }
  };

  const handleThemeToggle = () => {
    setThemeMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSendMessage = async () => {
    setIsLoading(true);
    try {
      await sendMessage(chatId, message);
      setSnackbar({ open: true, severity: "success", message: "Сообщение отправлено успешно!" });
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
      setSnackbar({ open: true, severity: "error", message: "Ошибка отправки сообщения." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFile = async () => {
    if (!file) {
      setSnackbar({ open: true, severity: "warning", message: "Выберите файл перед загрузкой." });
      return;
    }
    setIsLoading(true);
    setUploadProgress(0);
    try {
      const response = await sendFile(chatId, file, (event) => {
        const progress = Math.round((event.loaded * 100) / event.total);
        setUploadProgress(progress);
      });

      await fetch("http://localhost:5000/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          file_name: file.name,
          file_url: response.url,
        }),
      });

      setSnackbar({ open: true, severity: "success", message: "Файл успешно загружен!" });
      fetchUploadedFiles();
    } catch (error) {
      console.error("Ошибка загрузки файла:", error);
      setSnackbar({ open: true, severity: "error", message: "Ошибка загрузки файла." });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ThemeProvider theme={themeMode === "light" ? lightTheme : darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Box display="flex" sx={{ height: "80vh" }}>
          {/* Левая сторона */}
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              Telegram File Storage
            </Typography>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Chat ID"
                variant="outlined"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Message"
                variant="outlined"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="contained" onClick={handleSendMessage} disabled={isLoading}>
                  {isLoading ? <CircularProgress size={24} /> : "Отправить сообщение"}
                </Button>
              </Stack>
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>
                Загрузить файл
              </Typography>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ marginBottom: "10px" }}
                disabled={isLoading}
              />
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="contained" color="primary" onClick={handleSendFile} disabled={isLoading}>
                  {isLoading ? <CircularProgress size={24} /> : "Отправить файл"}
                </Button>
              </Stack>
              {isLoading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    {uploadProgress}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Правая сторона */}
          <Box sx={{ flex: 6, pl: 2, borderLeft: 1, borderColor: "divider" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Загруженные файлы</Typography>
              <Stack direction="row" spacing={2}>
                <IconButton onClick={handleThemeToggle}>
                  {themeMode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
                </IconButton>
                <Button variant="outlined" onClick={fetchUploadedFiles}>
                  Обновить
                </Button>
              </Stack>
            </Box>
            <Grid container spacing={2}>
              {uploadedFiles.map((file, index) => (
                <Grid item xs={4} key={index}>
                  <FileTile file={file} onDownload={handleDownload} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
