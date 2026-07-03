// Controlador del manual de convivencia.
// Guarda el PDF en Firebase Storage y sus metadatos en Firestore.
const admin = require("../../config/firebaseAdmin");
const { deleteStorageFile, uploadBufferToStorage } = require("../../utils/firebaseStorage");

const manualDoc = () => admin.firestore().collection("appSettings").doc("manualConvivencia");
const maxFileSize = 10 * 1024 * 1024;

const cleanupStorageFile = async (filePath) => {
  try {
    await deleteStorageFile(filePath);
  } catch (error) {
    console.warn("No se pudo eliminar el archivo anterior del manual:", error.message);
  }
};

const sanitizeFileName = (fileName = "manual.pdf") =>
  String(fileName)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w.-]/g, "")
    .toLowerCase();

const readMetadata = async () => {
  const snapshot = await manualDoc().get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data();
};

const mapMetadata = (metadata) => {
  if (!metadata) {
    return null;
  }

  return {
    fileName: metadata.fileName || "",
    fileSize: metadata.fileSize || 0,
    storedFileName: metadata.storedFileName || "",
    storagePath: metadata.storagePath || "",
    url: metadata.url || "",
    updatedBy: metadata.updatedBy || "Administrador",
    updatedByEmail: metadata.updatedByEmail || "",
    updatedAt:
      typeof metadata.updatedAt?.toDate === "function"
        ? metadata.updatedAt.toDate().toISOString()
        : metadata.updatedAt || "",
  };
};

const getManualConvivencia = async (req, res) => {
  try {
    const metadata = await readMetadata();

    return res.json({
      manual: mapMetadata(metadata),
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const uploadManualConvivencia = async (req, res) => {
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

  const currentMetadata = await readMetadata();
  const storedFileName = `${Date.now()}-${sanitizeFileName(fileName)}`;
  const uploadedManual = await uploadBufferToStorage({
    filePath: `manual-convivencia/${storedFileName}`,
    buffer,
    contentType: "application/pdf",
  });

  const metadata = {
    fileName,
    fileSize: buffer.length,
    storedFileName,
    storagePath: uploadedManual.storagePath,
    url: uploadedManual.downloadUrl,
    updatedBy: updatedBy || "Administrador",
    updatedByEmail: updatedByEmail || "",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await manualDoc().set(metadata);
    await cleanupStorageFile(currentMetadata?.storagePath);

    return res.status(201).json({
      mensaje: "Manual publicado correctamente.",
      manual: {
        ...mapMetadata(metadata),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    await deleteStorageFile(uploadedManual.storagePath);
    return res.status(500).json({ mensaje: error.message });
  }
};

const deleteManualConvivencia = async (req, res) => {
  try {
    const currentMetadata = await readMetadata();

    await deleteStorageFile(currentMetadata?.storagePath);
    await manualDoc().delete();

    return res.json({ mensaje: "Manual eliminado correctamente.", manual: null });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  deleteManualConvivencia,
  getManualConvivencia,
  uploadManualConvivencia,
};
