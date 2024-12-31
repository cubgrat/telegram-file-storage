import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { useTheme } from "@mui/material/styles";

const FileTile = ({ file, onDownload }) => {
  const isFileAvailable = Boolean(file.url);
  const theme = useTheme(); // Подключение текущей темы

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        textAlign: "center",
        position: "relative",
        aspectRatio: "1 / 1",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.palette.mode === "light" ? "#f5f5f5" : "#424242", // Цвет фона
        boxShadow: 1, // Добавление небольшой тени
      }}
    >
      <Typography
        variant="body2"
        sx={{
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: "100%",
          color: theme.palette.text.primary, // Цвет текста
        }}
      >
        {file.name || "Без имени"}
      </Typography>
      <IconButton
        onClick={() => isFileAvailable && onDownload(file.url, file.name)}
        disabled={!isFileAvailable}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: isFileAvailable ? "green" : "red", // Меняем цвет кнопки
        }}
      >
        <CloudDownloadIcon />
      </IconButton>
    </Box>
  );
};

export default FileTile;
