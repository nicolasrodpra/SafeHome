const admin = require("../config/firebaseAdmin");

const CONFIG_COLLECTION = "configuracion";
const VIGILANCIA_DOC_ID = "vigilancia";

const vigilanciaConfigDoc = () =>
  admin.firestore().collection(CONFIG_COLLECTION).doc(VIGILANCIA_DOC_ID);

const normalizeNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsedValue = Number(String(value || "").replace(",", ".").trim());
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const readVigilanciaConfig = async () => {
  const snapshot = await vigilanciaConfigDoc().get();
  const data = snapshot.data() || {};

  return {
    tarifaHoraVigilante: normalizeNumber(data.tarifaHoraVigilante),
    updatedAt: data.updatedAt || null,
    updatedByUid: String(data.updatedByUid || "").trim(),
    updatedByName: String(data.updatedByName || "").trim(),
  };
};

module.exports = {
  readVigilanciaConfig,
  vigilanciaConfigDoc,
};
