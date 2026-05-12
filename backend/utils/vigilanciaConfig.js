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

const WEEK_DAY_KEYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

const normalizeDailyRates = (value = {}) =>
  WEEK_DAY_KEYS.reduce((dailyRates, dayKey) => {
    dailyRates[dayKey] = normalizeNumber(value?.[dayKey]);
    return dailyRates;
  }, {});

const normalizeDailyChargeFlags = (value = {}, dailyRates = {}) =>
  WEEK_DAY_KEYS.reduce((chargeFlags, dayKey) => {
    const hasDailyRate = Object.prototype.hasOwnProperty.call(dailyRates || {}, dayKey);
    const disabledByFlag = value?.[dayKey] === false;
    const disabledByRate = hasDailyRate && normalizeNumber(dailyRates?.[dayKey]) === 0;

    chargeFlags[dayKey] = !(disabledByFlag || disabledByRate);
    return chargeFlags;
  }, {});

const readVigilanciaConfig = async () => {
  const snapshot = await vigilanciaConfigDoc().get();
  const data = snapshot.data() || {};

  return {
    tarifaHoraVigilante: normalizeNumber(data.tarifaHoraVigilante),
    tarifasPorDia: normalizeDailyRates(data.tarifasPorDia),
    cobroPorDia: normalizeDailyChargeFlags(data.cobroPorDia, data.tarifasPorDia),
    updatedAt: data.updatedAt || null,
    updatedByUid: String(data.updatedByUid || "").trim(),
    updatedByName: String(data.updatedByName || "").trim(),
  };
};

module.exports = {
  normalizeDailyChargeFlags,
  normalizeDailyRates,
  readVigilanciaConfig,
  vigilanciaConfigDoc,
  WEEK_DAY_KEYS,
};
