// Helpers de presentación para datos simples del usuario.
export const getUserInitials = (name, fallback = "U") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || fallback;
