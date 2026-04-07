// Servicio pequeño para acciones de autenticación del lado cliente.
import Swal from "sweetalert2";
import { clearSession } from "./sessionService";

// Esta función muestra la confirmación de salida y, si el usuario acepta,
// limpia la sesión local antes de volver al login.
export const cerrarSesion = async (navigate) => {
  const resultado = await Swal.fire({
    text: "¿Estás seguro de que deseas cerrar sesión?",
    icon: "warning",
    iconColor: "#460669",
    showCancelButton: true,
    confirmButtonColor: "#460669",
    cancelButtonColor: "#d33",
    confirmButtonText: "Confirmar",
    cancelButtonText: "Cancelar",
  });

  if (!resultado.isConfirmed) return;

  clearSession();
  navigate("/login", { replace: true });
};
