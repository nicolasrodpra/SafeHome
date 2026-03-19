import "../styles/Register.css";
import illustration from "../assets/REgistro.png";
import { useState } from "react";
// Firebase
import { auth, db } from "../FireBase/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import Swal from "sweetalert2";

export default function Register() {
  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
 
  const handleRegister = async (e) => {
    e.preventDefault();
 
    const rol = "Vigilante";
 
    // Validar campos vacíos
    if (!email || !name || !password) {
      Swal.fire({
        title: "Error",
        text: "Complete todos los campos requeridos",
        confirmButtonColor: "#460669",
        icon: "error",
      });
      return;
    }
 
    // Validar contraseñas
    if (password !== confirmPassword) {
      Swal.fire({
        title: "Error",
        text: "Las contraseñas no coinciden",
        confirmButtonColor: "#460669",
        icon: "error",
      });
      return;
    }
 
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
 
      // Enviar correo de verificación
      await sendEmailVerification(auth.currentUser);
 
      // Guardar datos en Firestore
      await addDoc(collection(db, "Users", "User_id", "Private_Data"), {
        Nombre: name,
        Correo: email,
        Id: user.uid,
        Rol: rol,
      });
 
      // Éxito
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Se ha registrado con éxito, verifique el correo electrónico",
        showConfirmButton: false,
        timer: 3000,
      });
 
      // Limpiar formulario
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
 
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
      });
    }
  };
 

  return (
    <div className="register-wrapper">

 
      <div className="left-panel">
        <div className="circle"></div>
        <img
          className="illustration"
          src={illustration}
          alt="ilustración"
        />
        <button className="btn-back">
          <i className="bi bi-arrow-left"></i> Regresar
        </button>
      </div>


      <div className="right-panel">
        <div className="form-box">
          <p className="welcome">Bienvenido</p>
          <h1 className="title">Regístrate</h1>

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

          <button className="btn-register">Registrar</button>
        </div>
      </div>

    </div>
  );
}
