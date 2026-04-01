import { signOut } from "firebase/auth";
import Swal from "sweetalert2";
import { auth } from "../pages/FireBase/firebase";

export const cerrarSesion = async (navigate) => {
  const resultado = await Swal.fire({
    text: "Estas seguro de que deseas cerrar sesion?",
    icon: "warning",
    iconColor: "#460669",
    showCancelButton: true,
    confirmButtonColor: "#460669",
    cancelButtonColor: "#d33",
    confirmButtonText: "Confirmar",
    cancelButtonText: "Cancelar",
  });

  if (!resultado.isConfirmed) return;

  try {
    await signOut(auth);
    navigate("/login");
  } catch (error) {
    console.error("Error al cerrar sesion:", error);
  }
};
