import ilustracionMenu from "../../assets/inicioHero.png";
import asistenteVirtual from "../../assets/asistenteVirtual.png";
import { Link, useNavigate } from "react-router-dom";
import { cerrarSesion } from "../../services/authService";
import '../../styles/admin/adminMenu.css';

function AdminMenu() {

  const navigate = useNavigate();
  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const fechaMayuscula = fecha.charAt(0).toUpperCase() + fecha.slice(1);


  return (
    <div className="app">

      <aside className="sidebar">
        <div className="sidebar-logo">SafeHome</div>

        <ul className="nav-menu">
          <button className="btn-create">
            <span>Crear nuevo <br />comunicado</span>
            <span className="plus">+</span>
          </button>

          <li><a href="#"><i className="ph-light ph-megaphone"></i> Quejas</a></li>
          <li><a href="#"><i className="ph-light ph-calendar-blank"></i> Reservas</a></li>
          <li><a href="#"><i className="ph-light ph-megaphone"></i> Comunicados</a></li>
          <li><a href="#"><i className="ph-light ph-security-camera"></i> Vigilancia</a></li>
          <li><a href="#"><i className="ph-light ph-user"></i> Residentes</a></li>
          <li><a href="#"><i className="ph-light ph-book-bookmark"></i> Manual Convivencia</a></li>
          <li><a href="#"><i className="ph-light ph-pencil-simple"></i> Actualizar datos</a></li>
          <li><a href="#"><i className="ph-light ph-user-plus"></i> Registrar Usuario</a></li>

          <div className="sidebar-assistant">
            <img src={asistenteVirtual} alt="asistenteVirtual" />
            <p>Asistente<br />Virtual</p>
            <button className="btn-asst">Iniciar</button>
          </div>
        </ul>
      </aside>

      <div className="main">

        <div className="topbar">
          <div className="topbar-left">
            <h2>Abundara</h2>
            <span>{fechaMayuscula}</span>
          </div>
          <div className="topbar-right">
            <i className="ph-light ph-envelope-simple topbar-icon"></i>
            <i className="ph-light ph-bell topbar-icon"></i>
            <i className="ph-light ph-sign-out topbar-icon" onClick={() => cerrarSesion(navigate)}></i>
            <div className="user-pill">
              <div className="user-avatar">NR</div>
              <span className="user-name">Nicolas Rodriguez</span>
              <i className="ph-light ph-caret-down user-caret"></i>
            </div>
          </div>
        </div>

        <div className="content">

          <div className="hero-banner">
            <div className="hero-banner-text">
              <h1>Hola, <span>Nicolas</span></h1>
              <p>Optimiza procesos, mejora la seguridad<br />y fortalece la convivencia.</p>
            </div>
            <img src={ilustracionMenu} alt="ilustracionMenu" />
          </div>

          <p className="section-label">Opciones</p>

          <div className="cards-grid">

            <a href="#" className="option-card">
              <div className="card-top">
                <h4>Quejas</h4>
                <p>Gestiona y da seguimiento a las quejas de los residentes.</p>
              </div>
              <div className="card-bottom">
                <i className="ph-light ph-arrow-right card-arrow"></i>
                <i className="ph-light ph-megaphone card-icon"></i>
              </div>
            </a>

            <a href="#" className="option-card">
              <div className="card-top">
                <h4>Reservas</h4>
                <p>Gestiona las reservas de zonas comunes y controla su disponibilidad.</p>
              </div>
              <div className="card-bottom">
                <i className="ph-light ph-arrow-right card-arrow"></i>
                <i className="ph-light ph-calendar-blank card-icon"></i>
              </div>
            </a>

            <a href="#" className="option-card">
              <div className="card-top">
                <h4>Comunicados</h4>
                <p>Publica y administra avisos importantes para los residentes.</p>
              </div>
              <div className="card-bottom">
                <i className="ph-light ph-arrow-right card-arrow"></i>
                <i className="ph-light ph-bell card-icon"></i>
              </div>
            </a>

            <Link to="/registroVehiculos" className="option-card">
              <div className="card-top">
                <h4>Vigilancia</h4>
                <p>Supervisa novedades de seguridad y registra eventos relevantes.</p>
              </div>
              <div className="card-bottom">
                <i className="ph-light ph-arrow-right card-arrow"></i>
                <i className="ph-light ph-security-camera card-icon"></i>
              </div>
            </Link>

            <a href="#" className="option-card">
              <div className="card-top">
                <h4>Residentes</h4>
                <p>Administra la información de los residentes del conjunto.</p>
              </div>
              <div className="card-bottom">
                <i className="ph-light ph-arrow-right card-arrow"></i>
                <i className="ph-light ph-user card-icon"></i>
              </div>
            </a>

            <a href="#" className="option-card">
              <div className="card-top">
                <h4>Manual Convivencia</h4>
                <p>Consulta y gestiona las normas del conjunto residencial.</p>
              </div>
              <div className="card-bottom">
                <i className="ph-light ph-arrow-right card-arrow"></i>
                <i className="ph-light ph-book-bookmark card-icon"></i>
              </div>
            </a>

            <a href="#" className="option-card">
              <div className="card-top">
                <h4>Actualización Datos</h4>
                <p>Modifica y mantiene actualizada tu información.</p>
              </div>
              <div className="card-bottom">
                <i className="ph-light ph-arrow-right card-arrow"></i>
                <i className="ph-light ph-pencil-simple card-icon"></i>
              </div>
            </a>

            <Link to="/registroResidente" className="option-card">
              <div className="card-top">
                <h4>Registrar Usuario</h4>
                <p>Crea nuevos usuarios y asigna sus datos de acceso al sistema.</p>
              </div>
              <div className="card-bottom">
                <i className="ph-light ph-arrow-right card-arrow"></i>
                <i className="ph-light ph-user-plus card-icon"></i>
              </div>
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMenu;
