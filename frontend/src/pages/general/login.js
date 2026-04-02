import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import illustration from "../../assets/Login.png";
import { auth, db } from "../../config/firebase";
import "../../styles/general/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const credentials = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const userDoc = await getDoc(doc(db, "users", credentials.user.uid));

      if (!userDoc.exists()) {
        throw new Error("No se encontro la informacion del usuario.");
      }

      const { rol } = userDoc.data();

      if (rol === "Vigilante") navigate("/vigilanteMenu");
      else if (rol === "Administrador") navigate("/adminMenu");
      else if (rol === "Residente") navigate("/residenteMenu");
      else throw new Error("El rol del usuario no es valido.");
    } catch (error) {
      let message = error.message;

      if (error.code === "auth/invalid-credential") {
        message = "Correo o contrasena incorrectos.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Demasiados intentos. Intenta mas tarde.";
      }

      Swal.fire({
        title: "Error",
        text: message,
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

          <button type="button" className="btn-register" onClick={handleLogin}>
            Iniciar sesion
          </button>
        </div>
      </div>
    </div>
  );
}
