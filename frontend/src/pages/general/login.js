import "../../styles/general/login.css";
import illustration from "../../assets/Login.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const navigate                = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw { message: data.mensaje };

      if (data.rol === "Vigilante")        navigate("/vigilanteMenu");
      else if (data.rol === "Administrador") navigate("/adminMenu");
      else if (data.rol === "Residente")   navigate("/residenteMenu");

    } catch (error) {
      Swal.fire({ title: "Error", text: error.message, icon: "error", confirmButtonColor: "#460669" });
    }
  };

  return (
    <div className="register-wrapper">
      <div className="left-panel">
        <div className="circle"></div>
        <img className="illustration" src={illustration} alt="ilustración" />
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
            <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="input-wrap">
            <i className="bi bi-lock"></i>
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="btn-register" onClick={handleLogin}>
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}