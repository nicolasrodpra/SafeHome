import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import Swal from "sweetalert2";

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

  if (resultado.isConfirmed) {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }
};