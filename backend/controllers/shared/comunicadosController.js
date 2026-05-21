const fs = require("fs");
const path = require("path");
const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
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
const comunicadosUploadsDir = path.join(__dirname, "..", "..", "uploads", "comunicados");

const comunicadosCollection = () => admin.firestore().collection("comunicados");

const ensureUploadsDir = () => {
  fs.mkdirSync(comunicadosUploadsDir, { recursive: true });
};

const sanitizeFileName = (fileName = "imagen") =>
  String(fileName)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w.-]/g, "")
    .toLowerCase();

const getComunicadoImageUrl = (req, storedFileName) =>
  storedFileName
    ? `${req.protocol}://${req.get("host")}/uploads/comunicados/${encodeURIComponent(storedFileName)}`
    : "";

const removeStoredImage = (storedFileName) => {
  if (!storedFileName) {
    return;
  }

  const imagePath = path.join(comunicadosUploadsDir, storedFileName);

  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
};

const parseImagePayload = ({ imageData, imageName }) => {
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

  ensureUploadsDir();
  fs.writeFileSync(path.join(comunicadosUploadsDir, storedFileName), buffer);

  return {
    imageName: normalizedImageName || storedFileName,
    imageStoredFileName: storedFileName,
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

const mapComunicado = (snapshotDoc, req) => {
  const data = snapshotDoc.data() || {};
  const createdAt = toDate(data.fecha || data.createdAt);

  return {
    id: snapshotDoc.id,
    asunto: normalizeText(data.asunto) || "Sin asunto",
    mensaje: normalizeText(data.mensaje) || "Sin mensaje",
    senderRole: resolveSenderRole(data.senderRole || data.rol),
    senderLabel: normalizeText(data.senderLabel) || getSenderLabel(data.senderRole || data.rol),
    imageName: normalizeText(data.imageName),
    imageUrl: getComunicadoImageUrl(req, normalizeText(data.imageStoredFileName)),
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
}) => ({
  asunto,
  mensaje,
  senderRole,
  senderLabel,
  imageName: normalizeText(imageName),
  imageStoredFileName: normalizeText(imageStoredFileName),
  fecha: admin.firestore.FieldValue.serverTimestamp(),
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const listarComunicados = async (req, res) => {
  try {
    const snapshot = await comunicadosCollection().get();
    const comunicados = snapshot.docs.map((docSnapshot) => mapComunicado(docSnapshot, req)).sort(sortByFechaDesc);

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
    storedImage = parseImagePayload({
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
        imageUrl: getComunicadoImageUrl(req, storedImage?.imageStoredFileName || ""),
      },
    });
  } catch (error) {
    removeStoredImage(storedImage?.imageStoredFileName);
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
    const currentStoredImage = normalizeText(currentData.imageStoredFileName);

    nextStoredImage = parseImagePayload({
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
    } else if (removeImage) {
      payload.imageName = "";
      payload.imageStoredFileName = "";
    }

    await comunicadoRef.update(payload);

    if (nextStoredImage && currentStoredImage) {
      removeStoredImage(currentStoredImage);
    }

    if (removeImage && currentStoredImage) {
      removeStoredImage(currentStoredImage);
    }

    return res.status(200).json({
      mensaje: "Comunicado actualizado correctamente.",
      comunicado: {
        id,
        asunto,
        mensaje,
        imageName: payload.imageName || normalizeText(currentData.imageName),
        imageUrl: getComunicadoImageUrl(
          req,
          payload.imageStoredFileName || (removeImage ? "" : currentStoredImage)
        ),
      },
    });
  } catch (error) {
    removeStoredImage(nextStoredImage?.imageStoredFileName);
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

    removeStoredImage(normalizeText(snapshot.data()?.imageStoredFileName));
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
