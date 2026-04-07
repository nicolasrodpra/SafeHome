// Pantalla de inicio de sesión.
// Recibe correo y contraseña, llama al backend y guarda la sesión
// para redirigir al menú principal según el rol.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { loginUser } from "../../services/modules/authApi";
import { saveSession } from "../../services/sessionService";
import "../../styles/general/login.css";

const LOGIN_ILLUSTRATION_URL =
  "https://conjuntolacascada.com.co/wp-content/uploads/2023/02/La_Cascada_new_117-scaled.jpeg";

const getRouteByRole = (role) => {
  if (role === "Vigilante") return "/vigilanteMenu";
  if (role === "Administrador") return "/adminMenu";
  if (role === "Residente") return "/residenteMenu";
  return "/login";
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const session = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!session?.rol) {
        throw new Error(
          "No se pudo identificar el rol del usuario. Reinicia el backend e inténtalo de nuevo."
        );
      }

      saveSession(session);
      navigate(getRouteByRole(session.rol), { replace: true });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo iniciar sesión.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    }
  };

  return (
    <div className="register-wrapper">
      <div className="left-panel">
        <div className="circle"></div>
        <img
          className="illustration"
          src={LOGIN_ILLUSTRATION_URL}
          alt="Familia revisando un teléfono móvil"
        />
        <Link to="/" className="btn-back">
          <i className="bi bi-arrow-left"></i> Regresar
        </Link>
      </div>

      <div className="right-panel">
        <div className="form-box">
          <p className="welcome">Bienvenido</p>
          <h1 className="title">Inicia sesión</h1>

          <div className="input-wrap">
            <i className="bi bi-envelope"></i>
            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="input-wrap">
            <i className="bi bi-lock"></i>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="button" className="btn-register" onClick={handleLogin}>
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
