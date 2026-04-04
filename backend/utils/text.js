// Esta función limpia textos simples para evitar espacios sobrantes
// cuando guardamos o comparamos datos del formulario.
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
