import { useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import illustration from "../../assets/registroAdmin.png";
import "../../styles/admin/registroAdmin.css";

export default function AdminRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/registrar-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || "No se pudo registrar el administrador.");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: data.mensaje,
        showConfirmButton: false,
        timer: 3000,
      });

      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#460669",
      });
    }
  };

  return (
    <div className="register-wrapper">
      <div className="left-panel">
        <div className="circle"></div>
        <img className="illustration" src={illustration} alt="ilustracion" />
        <Link to="/adminMenu" className="btn-back">
          <i className="bi bi-arrow-left"></i> Regresar
        </Link>
      </div>

      <div className="right-panel">
        <div className="form-box">
          <p className="welcome">Bienvenido</p>
          <h1 className="title">Registra un Administrador</h1>

          <div className="input-wrap">
            <i className="bi bi-envelope"></i>
            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-wrap">
            <i className="bi bi-lock"></i>
            <input
              type="password"
              placeholder="Contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="input-wrap">
            <i className="bi bi-check-circle"></i>
            <input
              type="password"
              placeholder="Confirma la contrasena"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="button" className="btn-register" onClick={handleRegister}>
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}
