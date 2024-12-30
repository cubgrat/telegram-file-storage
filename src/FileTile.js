import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

const FileTile = ({ file, onDownload }) => {
  const isFileAvailable = Boolean(file.url);

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
      }}
    >
      <Typography
        variant="body2"
        sx={{
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: "100%",
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