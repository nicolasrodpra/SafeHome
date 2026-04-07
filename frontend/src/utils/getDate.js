// Esta función devuelve la fecha actual ya lista para mostrarse
// en la barra superior con formato largo en español.
// Utilidad visual para la barra superior.
// Devuelve la fecha actual lista para mostrarse en formato largo.
export function getFechaActual() {
  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return fecha.charAt(0).toUpperCase() + fecha.slice(1);
}
