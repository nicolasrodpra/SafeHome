export function getFechaActual() {
  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return fecha.charAt(0).toUpperCase() + fecha.slice(1);
}
