import "../styles/login.css";
import illustration from "../assets/Login.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../FireBase/firebase";
import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const navigate                = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire({ title: "Error", text: "Completa todos los campos", icon: "error", confirmButtonColor: "#460669" });
      return;
    }

    try {

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        Swal.fire({ title: "Error", text: "No se encontró información del usuario.", icon: "error", confirmButtonColor: "#460669" });
        return;
      }

      const rol = userDoc.data().rol;

<<<<<<< HEAD
=======
      // 3. Redirigir según el rol
>>>>>>> 6de13a85a39d75d6608f5df00186ce93d4b015f7
      if (rol === "Vigilante") {
        navigate("/Vigilant_Menu");
      } else if (rol === "Administrador") {
        navigate("/Admin_Menu");
      } else if (rol === "Residente") {
        navigate("/Residente_Menu");
      } else {
        Swal.fire({ title: "Error", text: "Rol no reconocido.", icon: "error", confirmButtonColor: "#460669" });
      }

    } catch (error) {
      let mensaje = error.message;
      if (error.code === "auth/invalid-credential")     mensaje = "Correo o contraseña incorrectos.";
      else if (error.code === "auth/user-not-found")    mensaje = "No existe una cuenta con este correo.";
      else if (error.code === "auth/wrong-password")    mensaje = "Contraseña incorrecta.";
      else if (error.code === "auth/too-many-requests") mensaje = "Demasiados intentos. Intenta más tarde.";

      Swal.fire({ title: "Error", text: mensaje, icon: "error", confirmButtonColor: "#460669" });
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


          <button className="btn-register" onClick={handleLogin}>
            Iniciar sesión
          </button>
        </div>
      </div>

    </div>
  );
}