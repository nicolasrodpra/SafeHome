import "../../styles/residente/registroResidente.css";
import illustration from "../../assets/residenteRegistro.png";
import { useState } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../../FireBase/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";

export default function Resident_Register() {
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      Swal.fire({ title: "Error", text: "Complete todos los campos", confirmButtonColor: "#460669", icon: "error" });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({ title: "Error", text: "Las contraseñas no coinciden", confirmButtonColor: "#460669", icon: "error" });
      return;
    }

    if (password.length < 6) {
      Swal.fire({ title: "Error", text: "La contraseña debe tener al menos 6 caracteres", confirmButtonColor: "#460669", icon: "error" });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(auth.currentUser);

      await setDoc(doc(db, "users", user.uid), {
        correo: email,
        rol: "Residente",
        creadoEn: serverTimestamp(),
      });

      Swal.fire({
        position: "center",
        icon: "success",
        title: "Registrado con éxito, verifique su correo electrónico",
        showConfirmButton: false,
        timer: 3000,
      });

      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      let mensaje = error.message;
      if (error.code === "auth/email-already-in-use") mensaje = "Este correo ya está registrado.";
      else if (error.code === "auth/invalid-email")   mensaje = "El correo no tiene un formato válido.";
      else if (error.code === "auth/weak-password")   mensaje = "La contraseña debe tener al menos 6 caracteres.";

      Swal.fire({ title: "Error", text: mensaje, icon: "error", confirmButtonColor: "#460669" });
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
          <h1 className="title">Registra un Residente</h1>

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

          <div className="input-wrap">
            <i className="bi bi-check-circle"></i>
            <input
              type="password"
              placeholder="Confirma la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button className="btn-register" onClick={handleRegister}>
            Registrar
          </button>
        </div>
      </div>

    </div>
  );
}