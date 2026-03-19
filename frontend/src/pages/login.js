import "../styles/login.css";
import illustration from "../assets/Login.png";
import { useState } from "react";
import { Link } from "react-router-dom";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  return (
    <div className="register-wrapper">

 
      <div className="left-panel">
        <div className="circle"></div>
        <img
          className="illustration"
          src={illustration}
          alt="ilustración"
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
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-wrap">
            <i className="bi bi-lock"></i>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

            <Link to="/register" className="btn-back">
          <i className="bi bi-arrow-left"></i> regidtro
        </Link>

          <button className="btn-register">Iniciar sesión</button>
        </div>
      </div>

    </div>
  );
}
