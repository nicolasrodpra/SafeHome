import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import illustration from "../../assets/registroAdmin.png";
import "../../styles/admin/registroAdmin.css";

const roleOptions = ["Administrador", "Residente", "Vigilante"];

export default function AdminRegister() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setRoleMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setRoleMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/registrar-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, rol, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.mensaje || "No se pudo registrar el usuario.");
      }

      Swal.fire({
        position: "center",
        icon: "success",
        title: data.mensaje,
        showConfirmButton: false,
        timer: 3000,
      });

      setNombre("");
      setEmail("");
      setRol("");
      setPassword("");
      setConfirmPassword("");
      setRoleMenuOpen(false);

      if (rol === "Administrador") navigate("/adminMenu");
      else if (rol === "Residente") navigate("/residenteMenu");
      else if (rol === "Vigilante") navigate("/vigilanteMenu");
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
          <h1 className="title">Registrar usuario</h1>

          <div className="input-wrap">
            <i className="bi bi-person"></i>
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="input-wrap">
            <i className="bi bi-envelope"></i>
            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-wrap input-wrap-role" ref={roleMenuRef}>
            <button
              type="button"
              className={`role-trigger${roleMenuOpen ? " open" : ""}`}
              onClick={() => setRoleMenuOpen((current) => !current)}
              aria-haspopup="listbox"
              aria-expanded={roleMenuOpen}
            >
              <span className={`role-trigger-value${rol ? "" : " placeholder"}`}>
                {rol || "Selecciona su rol"}
              </span>
              <span className="select-chevron">
                <span className="select-chevron-symbol"></span>
              </span>
            </button>

            {roleMenuOpen && (
              <div className="role-dropdown" role="listbox" aria-label="Seleccionar rol">
                {roleOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`role-option${rol === option ? " active" : ""}`}
                    onClick={() => {
                      setRol(option);
                      setRoleMenuOpen(false);
                    }}
                  >
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            )}
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
