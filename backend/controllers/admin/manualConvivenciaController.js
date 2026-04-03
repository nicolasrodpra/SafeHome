const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "..", "..", "uploads", "manual-convivencia");
const dataDir = path.join(__dirname, "..", "..", "data");
const metadataPath = path.join(dataDir, "manualConvivencia.json");
const maxFileSize = 10 * 1024 * 1024;

const ensureDirectories = () => {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });
};

const sanitizeFileName = (fileName = "manual.pdf") =>
  fileName.replace(/\s+/g, "-").replace(/[^\w.-]/g, "").toLowerCase();

const getPublicUrl = (req, fileName) =>
  `${req.protocol}://${req.get("host")}/uploads/manual-convivencia/${encodeURIComponent(fileName)}`;

const readMetadata = () => {
  try {
    if (!fs.existsSync(metadataPath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    return null;
  }
};

const writeMetadata = (metadata) => {
  ensureDirectories();
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
};

const removeCurrentFile = () => {
  const currentMetadata = readMetadata();

  if (!currentMetadata?.storedFileName) {
    return;
  }

  const currentFilePath = path.join(uploadsDir, currentMetadata.storedFileName);

  if (fs.existsSync(currentFilePath)) {
    fs.unlinkSync(currentFilePath);
  }
};

const getManualConvivencia = (req, res) => {
  const metadata = readMetadata();

  if (!metadata) {
    return res.json({ manual: null });
  }

  return res.json({
    manual: {
      ...metadata,
      url: getPublicUrl(req, metadata.storedFileName),
    },
  });
};

const uploadManualConvivencia = (req, res) => {
  const { fileName, fileData, updatedBy, updatedByEmail } = req.body || {};

  if (!fileName || !fileData) {
    return res.status(400).json({ mensaje: "Debes enviar el nombre y el contenido del PDF." });
  }

  if (!String(fileName).toLowerCase().endsWith(".pdf")) {
    return res.status(400).json({ mensaje: "Solo se permiten archivos PDF." });
  }

  const match = String(fileData).match(/^data:application\/pdf;base64,(.+)$/);

  if (!match) {
    return res.status(400).json({ mensaje: "El archivo enviado no tiene un formato PDF valido." });
  }

  const buffer = Buffer.from(match[1], "base64");

  if (buffer.length > maxFileSize) {
    return res.status(400).json({ mensaje: "El archivo supera el limite de 10 MB." });
  }

  ensureDirectories();
  removeCurrentFile();

  const storedFileName = `${Date.now()}-${sanitizeFileName(fileName)}`;
  const destinationPath = path.join(uploadsDir, storedFileName);

  fs.writeFileSync(destinationPath, buffer);

  const metadata = {
    fileName,
    fileSize: buffer.length,
    storedFileName,
    updatedBy: updatedBy || "Administrador",
    updatedByEmail: updatedByEmail || "",
    updatedAt: new Date().toISOString(),
  };

  writeMetadata(metadata);

  return res.status(201).json({
    mensaje: "Manual publicado correctamente.",
    manual: {
      ...metadata,
      url: getPublicUrl(req, storedFileName),
    },
  });
};

const deleteManualConvivencia = (req, res) => {
  removeCurrentFile();

  if (fs.existsSync(metadataPath)) {
    fs.unlinkSync(metadataPath);
  }

  return res.json({ mensaje: "Manual eliminado correctamente.", manual: null });
};

module.exports = {
  deleteManualConvivencia,
  getManualConvivencia,
  uploadManualConvivencia,
};
