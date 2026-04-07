// Esta función convierte un timestamp de Firestore en un objeto Date normal.
// Así el resto del código puede trabajar con fechas de JavaScript sin complicarse.
// Utilidades de fecha para Firestore.
// Traducen timestamps a Date y formatean texto listo para frontend.
const toDate = (timestamp) => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }

  return null;
};

const formatDateLabel = (timestampOrDate) => {
  const dateValue = timestampOrDate instanceof Date ? timestampOrDate : toDate(timestampOrDate);

  if (!dateValue) {
    return "";
  }

  return dateValue.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTimeLabel = (timestampOrDate) => {
  const dateValue = timestampOrDate instanceof Date ? timestampOrDate : toDate(timestampOrDate);

  if (!dateValue) {
    return "";
  }

  return dateValue.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

module.exports = {
  formatDateLabel,
  formatTimeLabel,
  toDate,
};
