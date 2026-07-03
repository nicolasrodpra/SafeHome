const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { deleteStorageFile, uploadBufferToStorage } = require("../../utils/firebaseStorage");
const { normalizeComparableText, normalizeText } = require("../../utils/text");
const { parseBoolean } = require("../../utils/validation");

const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;
const IMAGE_MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const comunicadosCollection = () => admin.firestore().collection("comunicados");

const cleanupStorageFile = async (filePath) => {
  try {
    await deleteStorageFile(filePath);
  } catch (error) {
    console.warn("No se pudo eliminar el archivo anterior del comunicado:", error.message);
  }
};

const sanitizeFileName = (fileName = "imagen") =>
  String(fileName)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w.-]/g, "")
    .toLowerCase();

const parseImagePayload = async ({ imageData, imageName }) => {
  const normalizedImageData = normalizeText(imageData);
  const normalizedImageName = normalizeText(imageName);

  if (!normalizedImageData) {
    return null;
  }

  const createValidationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
  };

  const match = normalizedImageData.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/i);

  if (!match) {
    throw createValidationError("La imagen del comunicado no tiene un formato válido.");
  }

  const mimeType = match[1].toLowerCase();
  const extension = IMAGE_MIME_EXTENSIONS[mimeType];

  if (!extension) {
    throw createValidationError("Solo se permiten imágenes JPG, PNG, WEBP o GIF.");
  }

  const buffer = Buffer.from(match[2], "base64");

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw createValidationError("La imagen supera el límite de 6 MB.");
  }

  const storedFileName = `${Date.now()}-${sanitizeFileName(normalizedImageName || `comunicado${extension}`)}`;
  const storagePath = `comunicados/${storedFileName}`;
  const uploadedImage = await uploadBufferToStorage({
    filePath: storagePath,
    buffer,
    contentType: mimeType,
  });

  return {
    imageName: normalizedImageName || storedFileName,
    imageStoredFileName: storedFileName,
    imageStoragePath: uploadedImage.storagePath,
    imageUrl: uploadedImage.downloadUrl,
  };
};

const resolveSenderRole = (value) =>
  normalizeComparableText(value) === normalizeComparableText("Vigilante")
    ? "Vigilante"
    : "Administrador";

const getSenderLabel = (role) =>
  resolveSenderRole(role) === "Vigilante" ? "Vigilancia" : "Administracion";

const sortByFechaDesc = (firstItem, secondItem) => {
  const firstDate = firstItem.createdAt?.getTime?.() || 0;
  const secondDate = secondItem.createdAt?.getTime?.() || 0;

  return secondDate - firstDate;
};

const mapComunicado = (snapshotDoc) => {
  const data = snapshotDoc.data() || {};
  const createdAt = toDate(data.fecha || data.createdAt);

  return {
    id: snapshotDoc.id,
    asunto: normalizeText(data.asunto) || "Sin asunto",
    mensaje: normalizeText(data.mensaje) || "Sin mensaje",
    senderRole: resolveSenderRole(data.senderRole || data.rol),
    senderLabel: normalizeText(data.senderLabel) || getSenderLabel(data.senderRole || data.rol),
    imageName: normalizeText(data.imageName),
    imageUrl: normalizeText(data.imageUrl),
    imageStoragePath: normalizeText(data.imageStoragePath),
    fecha: formatDateLabel(createdAt),
    hora: formatTimeLabel(createdAt),
    fechaCompleta: createdAt?.toISOString?.() || null,
    createdAt,
  };
};

const buildComunicadoPayload = ({
  asunto,
  mensaje,
  senderRole,
  senderLabel,
  imageName,
  imageStoredFileName,
  imageStoragePath,
  imageUrl,
}) => ({
  asunto,
  mensaje,
  senderRole,
  senderLabel,
  imageName: normalizeText(imageName),
  imageStoredFileName: normalizeText(imageStoredFileName),
  imageStoragePath: normalizeText(imageStoragePath),
  imageUrl: normalizeText(imageUrl),
  fecha: admin.firestore.FieldValue.serverTimestamp(),
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const listarComunicados = async (req, res) => {
  try {
    const snapshot = await comunicadosCollection().get();
    const comunicados = snapshot.docs.map((docSnapshot) => mapComunicado(docSnapshot)).sort(sortByFechaDesc);

    return res.status(200).json(comunicados.map(({ createdAt, ...comunicado }) => comunicado));
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const crearComunicado = async (req, res) => {
  const asunto = normalizeText(req.body?.asunto);
  const mensaje = normalizeText(req.body?.mensaje);
  const senderRole = resolveSenderRole(req.body?.senderRole || req.body?.rol);
  const senderLabel = getSenderLabel(senderRole);

  if (!asunto || !mensaje) {
    return res.status(400).json({
      mensaje: "Debes completar el asunto y el mensaje del comunicado.",
    });
  }

  let storedImage = null;

  try {
    storedImage = await parseImagePayload({
      imageData: req.body?.imageData,
      imageName: req.body?.imageName,
    });

    const ref = await comunicadosCollection().add(
      buildComunicadoPayload({
        asunto,
        mensaje,
        senderRole,
        senderLabel,
        imageName: storedImage?.imageName || "",
        imageStoredFileName: storedImage?.imageStoredFileName || "",
        imageStoragePath: storedImage?.imageStoragePath || "",
        imageUrl: storedImage?.imageUrl || "",
      })
    );

    return res.status(201).json({
      mensaje: "Comunicado guardado correctamente.",
      comunicado: {
        id: ref.id,
        asunto,
        mensaje,
        senderRole,
        senderLabel,
        imageName: storedImage?.imageName || "",
        imageUrl: storedImage?.imageUrl || "",
      },
    });
  } catch (error) {
    await deleteStorageFile(storedImage?.imageStoragePath);
    return res.status(error.statusCode || 500).json({ mensaje: error.message });
  }
};

const actualizarComunicado = async (req, res) => {
  const { id } = req.params;
  const asunto = normalizeText(req.body?.asunto);
  const mensaje = normalizeText(req.body?.mensaje);
  const removeImage = parseBoolean(req.body?.removeImage);

  if (!asunto || !mensaje) {
    return res.status(400).json({
      mensaje: "Debes completar el asunto y el mensaje del comunicado.",
    });
  }

  let nextStoredImage = null;

  try {
    const comunicadoRef = comunicadosCollection().doc(id);
    const snapshot = await comunicadoRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ mensaje: "No se encontró el comunicado solicitado." });
    }

    const currentData = snapshot.data() || {};
    const currentStoragePath = normalizeText(currentData.imageStoragePath);

    nextStoredImage = await parseImagePayload({
      imageData: req.body?.imageData,
      imageName: req.body?.imageName,
    });

    const payload = {
      asunto,
      mensaje,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (nextStoredImage) {
      payload.imageName = nextStoredImage.imageName;
      payload.imageStoredFileName = nextStoredImage.imageStoredFileName;
      payload.imageStoragePath = nextStoredImage.imageStoragePath;
      payload.imageUrl = nextStoredImage.imageUrl;
    } else if (removeImage) {
      payload.imageName = "";
      payload.imageStoredFileName = "";
      payload.imageStoragePath = "";
      payload.imageUrl = "";
    }

    await comunicadoRef.update(payload);

    if (nextStoredImage && currentStoragePath) {
      await cleanupStorageFile(currentStoragePath);
    }

    if (removeImage && currentStoragePath) {
      await cleanupStorageFile(currentStoragePath);
    }

    return res.status(200).json({
      mensaje: "Comunicado actualizado correctamente.",
      comunicado: {
        id,
        asunto,
        mensaje,
        imageName: payload.imageName || normalizeText(currentData.imageName),
        imageUrl: payload.imageUrl || (removeImage ? "" : normalizeText(currentData.imageUrl)),
      },
    });
  } catch (error) {
    await deleteStorageFile(nextStoredImage?.imageStoragePath);
    return res.status(error.statusCode || 500).json({ mensaje: error.message });
  }
};

const eliminarComunicado = async (req, res) => {
  const { id } = req.params;

  try {
    const comunicadoRef = comunicadosCollection().doc(id);
    const snapshot = await comunicadoRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ mensaje: "No se encontro el comunicado solicitado." });
    }

    await deleteStorageFile(normalizeText(snapshot.data()?.imageStoragePath));
    await comunicadoRef.delete();
    return res.status(200).json({ mensaje: "Comunicado eliminado correctamente." });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  actualizarComunicado,
  crearComunicado,
  eliminarComunicado,
  listarComunicados,
};
