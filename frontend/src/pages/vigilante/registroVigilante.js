import "../../styles/vigilante/registroVigilante.css";
import illustration from "../../assets/registroVigilante.png";
import { useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

export default function Vigilant_Register() {
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/registrar-vigilante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) throw { message: data.mensaje };

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
      Swal.fire({ title: "Error", text: error.message, icon: "error", confirmButtonColor: "#460669" });
    }
  };

  return (
    <div className="register-wrapper">
      <div className="left-panel">
        <div className="circle"></div>
        <img className="illustration" src={illustration} alt="ilustración" />
        <Link to="/login" className="btn-back">
          <i className="bi bi-arrow-left"></i> Regresar
        </Link>
      </div>

      <div className="right-panel">
        <div className="form-box">
          <p className="welcome">Bienvenido</p>
          <h1 className="title">Registra un vigilante</h1>

          <div className="input-wrap">
            <i className="bi bi-envelope"></i>
            <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="input-wrap">
            <i className="bi bi-lock"></i>
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="input-wrap">
            <i className="bi bi-check-circle"></i>
            <input type="password" placeholder="Confirma la contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          <button className="btn-register" onClick={handleRegister}>
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}