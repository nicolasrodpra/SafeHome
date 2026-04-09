// Constructor de perfil estable para el frontend.
// Toma datos heterogéneos de Firestore y devuelve siempre
// el mismo formato de sesión o perfil.
const { normalizeText } = require("./text");

// Esta función arma un perfil consistente porque en la base actual
// hay campos guardados con nombres distintos (`correo` o `email`,
// `cédula` o `documento`, etc.).
const buildUserProfile = (uid, data = {}) => {
  const nombres = normalizeText(data.nombres);
  const apellidos = normalizeText(data.apellidos);
  const nombreCompleto =
    normalizeText(data.nombre) ||
    [nombres, apellidos].filter(Boolean).join(" ").trim() ||
    "Usuario";

  return {
    uid,
    nombre: nombreCompleto,
    nombres,
    apellidos,
    cedula: normalizeText(data.cedula || data.documento),
    email: normalizeText(data.email || data.correo),
    rol: normalizeText(data.rol) || "Usuario",
    torre: normalizeText(data.torre),
    apartamento: normalizeText(data.apartamento),
    zonaVigilancia: normalizeText(data.zonaVigilancia),
    tipoSangre: normalizeText(data.tipoSangre),
    tarifaHora:
      typeof data.tarifaHora === "number" && Number.isFinite(data.tarifaHora)
        ? data.tarifaHora
        : 0,
    cantidadParqueaderos:
      typeof data.cantidadParqueaderos === "number" && Number.isFinite(data.cantidadParqueaderos)
        ? data.cantidadParqueaderos
        : 0,
  };
};

module.exports = {
  buildUserProfile,
};
