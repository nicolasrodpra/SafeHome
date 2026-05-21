const { normalizeComparableText, normalizeText } = require("./text");

const isNumericText = (value) => /^\d+$/.test(normalizeText(value));

const isPositiveInteger = (value) => {
  const normalizedValue = typeof value === "number" ? String(value) : normalizeText(value);
  return /^\d+$/.test(normalizedValue) && Number.parseInt(normalizedValue, 10) > 0;
};

const parsePositiveInteger = (value) => {
  if (!isPositiveInteger(value)) {
    return NaN;
  }

  return Number.parseInt(String(value).trim(), 10);
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(value));

const isAllowedValue = (value, allowedValues = []) => {
  const normalizedValue = normalizeComparableText(value);
  return allowedValues.some((allowedValue) => normalizeComparableText(allowedValue) === normalizedValue);
};

const normalizeAllowedValue = (value, allowedValues = []) => {
  const normalizedValue = normalizeComparableText(value);
  return (
    allowedValues.find(
      (allowedValue) => normalizeComparableText(allowedValue) === normalizedValue
    ) || ""
  );
};

const normalizeLocationValue = (value) => {
  const normalizedValue = normalizeText(value).toUpperCase().replace(/\s+/g, "");

  if (!normalizedValue) {
    return "";
  }

  return /^\d+$/.test(normalizedValue)
    ? String(Number.parseInt(normalizedValue, 10))
    : normalizedValue;
};

const normalizePlate = (value) => normalizeText(value).toUpperCase().replace(/\s+/g, "");

const isValidDateKey = (value) => {
  const dateKey = normalizeText(value);
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return false;
  }

  const [, year, month, day] = match.map(Number);
  const dateValue = new Date(year, month - 1, day);

  return (
    dateValue.getFullYear() === year &&
    dateValue.getMonth() === month - 1 &&
    dateValue.getDate() === day
  );
};

const parseBoolean = (value) => value === true || value === "true";

module.exports = {
  isAllowedValue,
  isNumericText,
  isPositiveInteger,
  isValidDateKey,
  isValidEmail,
  normalizeAllowedValue,
  normalizeLocationValue,
  normalizePlate,
  parseBoolean,
  parsePositiveInteger,
};
