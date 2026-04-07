// Esta función limpia textos simples para evitar espacios sobrantes
// Se usan para limpiar y normalizar valores antes de guardar o comparar.
const normalizeText = (value) => (typeof value === "string" ? value.trim() : ""); 

// Esta versión además convierte el texto a minúsculas y quita tildes.
// Sirve cuando queremos comparar palabras sin importar cómo vengan escritas.
const normalizeComparableText = (value) =>
  normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

module.exports = {
  normalizeComparableText,
  normalizeText,
};
