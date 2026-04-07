// Pantalla de inicio de sesion.
// Recibe correo y contrasena, llama al backend y guarda la sesion
// para redirigir al menu principal segun el rol.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import illustration from "../../assets/loginFamily.jpg";
import { loginUser } from "../../services/modules/authApi";
import { saveSession } from "../../services/sessionService";
import "../../styles/general/login.css";

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
          "No se pudo identificar el rol del usuario. Reinicia el backend e intentalo de nuevo."
        );
      }

      saveSession(session);
      navigate(getRouteByRole(session.rol), { replace: true });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo iniciar sesion.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    }
  };

  return (
    <div className="register-wrapper">
      <div className="left-panel">
        <div className="circle"></div>
        <img className="illustration" src={illustration} alt="Ilustracion de inicio de sesion" />
        <Link to="/" className="btn-back">
          <i className="bi bi-arrow-left"></i> Regresar
        </Link>
      </div>

      <div className="right-panel">
        <div className="form-box">
          <p className="welcome">Bienvenido</p>
          <h1 className="title">Inicia sesion</h1>

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
              placeholder="Contrasena"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="button" className="btn-register" onClick={handleLogin}>
            Iniciar sesion
          </button>
        </div>
      </div>
    </div>
  );
}
