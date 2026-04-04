const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "..", "..", "uploads", "manual-convivencia");
const dataDir = path.join(__dirname, "..", "..", "data");
const metadataPath = path.join(dataDir, "manualConvivencia.json");
const maxFileSize = 10 * 1024 * 1024;

// Este paso crea las carpetas necesarias antes de guardar el PDF
// y su archivo de metadatos.
const ensureDirectories = () => {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });
};

// Limpiamos el nombre del archivo para evitar espacios raros
// o caracteres que puedan dar problemas al guardarlo.
const sanitizeFileName = (fileName = "manual.pdf") =>
  fileName.replace(/\s+/g, "-").replace(/[^\w.-]/g, "").toLowerCase();

// Con esta URL el frontend puede abrir el manual usando la ruta pública del servidor.
const getPublicUrl = (req, fileName) =>
  `${req.protocol}://${req.get("host")}/uploads/manual-convivencia/${encodeURIComponent(fileName)}`;

// Aquí leemos los metadatos del manual actual. Si algo falla,
// devolvemos `null` para que la app entienda que no hay manual publicado.
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

// Guardamos un pequeño resumen del archivo para no tener que leer el PDF
// completo cada vez que el frontend pregunta por el manual.
const writeMetadata = (metadata) => {
  ensureDirectories();
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
};

// Antes de subir una nueva versión eliminamos la anterior
// para que no queden PDFs viejos ocupando espacio.
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

// Esta ruta devuelve la información del manual actual, si existe.
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

// Esta función recibe el PDF en base64, valida su tamaño y formato,
// lo guarda en disco y actualiza sus metadatos.
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
    return res.status(400).json({ mensaje: "El archivo enviado no tiene un formato PDF válido." });
  }

  const buffer = Buffer.from(match[1], "base64");

  if (buffer.length > maxFileSize) {
    return res.status(400).json({ mensaje: "El archivo supera el límite de 10 MB." });
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

// Aquí eliminamos tanto el archivo físico como los metadatos
// para dejar el módulo sin manual publicado.
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
