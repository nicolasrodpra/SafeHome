<<<<<<< HEAD
import ilustracionMenu from "../assets/ilustracionMenu.png";
import asistenteVirtual from "../assets/asistenteVirtual.png";
import { Link } from "react-router-dom";
import '../styles/adminMenu.css';

function adminMenu() {
  return (
    <div className="app">

      <aside className="sidebar">
        <div className="sidebar-logo">SafeHome</div>

        <button className="btn-create">
          <span>Crear nuevo comunicado</span>
          <span className="plus">+</span>
        </button>

        <ul className="nav-menu">
          <li><a href="#" className="active"><i className="ph-light ph-megaphone"></i> Quejas</a></li>
          <li><a href="#"><i className="ph-light ph-calendar-blank"></i> Reservas</a></li>
          <li><a href="#"><i className="ph-light ph-megaphone"></i> Comunicados</a></li>
          <li><a href="#"><i className="ph-light ph-security-camera"></i> Vigilancia</a></li>
          <li><a href="#"><i className="ph-light ph-user"></i> Residentes</a></li>
          <li><a href="#"><i className="ph-light ph-book-bookmark"></i> Manual Convivencia</a></li>
          <li><a href="#"><i className="ph-light ph-pencil-simple"></i> Actualizar datos</a></li>
          <li><a href="#"><i className="ph-light ph-user-plus"></i> Registrar Usuario</a></li>
        </ul>

        <div className="sidebar-assistant">
          <img src={asistenteVirtual} alt="asistenteVirtual" />
          <p>Asistente<br />virtual</p>
          <button className="btn-asst">Iniciar</button>
        </div>
      </aside>

      <div className="main">

        <div className="topbar">
          <div className="topbar-left">
            <h2>Abundara</h2>
            <span>Lunes, 2 Marzo 2026</span>
          </div>
          <div className="topbar-right">
            <i className="ph-light ph-envelope-simple topbar-icon"></i>
            <i className="ph-light ph-bell topbar-icon"></i>
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
        <img src={ilustracionMenu} alt="ilustracionMenu"/>
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

            <Link to="/Registro_Vehiculos" className="option-card">
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
            <Link to="/ResidentRegister" className="option-card">
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

export default adminMenu;
=======

export default function AdminMenu() {
  return (
  <p className="welcome">Bienvenido Administrador</p>
  );
}
>>>>>>> 6de13a85a39d75d6608f5df00186ce93d4b015f7
