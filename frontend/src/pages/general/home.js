// Pagina publica de presentacion del proyecto.
// Su objetivo es explicar que hace SafeHome y dirigir al login.
import { Link } from "react-router-dom";
import homeHeroFamily from "../../assets/homeHeroFamily.jpg";
import safehomeLogo from "../../assets/safehomeLogo.png";
import safehomeLogoWhite from "../../assets/safehomeLogoWhite.png";
import "../../styles/general/home.css";

// Enlaces internos del landing para movernos entre secciones informativas.
const navLinks = [
  { href: "#features", label: "Objetivos" },
  { href: "#roles", label: "Roles" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#servicios", label: "Servicios" },
];

const featureCards = [
  {
    icon: "ph-lock",
    title: "Mayor seguridad",
    copy:
      "Ofrecemos un control más riguroso de ingresos y salidas para fortalecer la seguridad del conjunto residencial.",
  },
  {
    icon: "ph-chat-dots",
    title: "Mejor comunicación",
    copy:
      "Conectamos residentes, portería y administración en una sola plataforma para que la información fluya mejor.",
  },
  {
    icon: "ph-clock",
    title: "Mayor agilidad",
    copy:
      "Automatizamos procesos como ingresos, autorizaciones y reportes para ahorrar tiempo en la operación diaria.",
  },
];

const roleCards = [
  {
    icon: "ph-user",
    title: "Administrador",
    copy:
      "Gestiona el sistema, organiza documentos, responde solicitudes y supervisa el funcionamiento general del conjunto.",
  },
  {
    icon: "ph-house",
    title: "Residente",
    copy:
      "Consulta información, realiza solicitudes, reserva espacios y recibe novedades importantes del conjunto.",
  },
  {
    icon: "ph-eye",
    title: "Vigilante",
    copy:
      "Controla accesos, registra visitas y apoya el orden y la seguridad en portería.",
  },
];

const aboutColumns = [
  {
    title: "Misión",
    copy:
      "Brindar una solución digital que mejore la organización, la seguridad y la agilidad en conjuntos residenciales.",
  },
  {
    title: "Visión",
    copy:
      "Ser una aplicación reconocida por modernizar la gestión residencial con seguridad, claridad y facilidad de uso.",
  },
  {
    title: "Quiénes somos",
    copy:
      "Somos un equipo comprometido con mejorar la administración de conjuntos residenciales mediante tecnología útil y cercana.",
  },
];

const serviceCards = [
  {
    icon: "ph-door-open",
    title: "Gestión de accesos",
    copy:
      "Control de entradas y salidas de residentes y visitantes para reforzar la seguridad del conjunto.",
  },
  {
    icon: "ph-paper-plane-tilt",
    title: "Mensajería y solicitudes",
    copy:
      "Los residentes pueden enviar mensajes o solicitudes y recibir respuesta de forma más ágil.",
  },
  {
    icon: "ph-calendar",
    title: "Reservas de zonas comunes",
    copy:
      "Permite apartar espacios como salones, canchas o piscinas con un proceso más rápido.",
  },
  {
    icon: "ph-chats",
    title: "Comunicación interna",
    copy:
      "Canal directo entre residentes y administración para resolver dudas y compartir información relevante.",
  },
  {
    icon: "ph-suitcase-simple",
    title: "Panel administrativo",
    copy:
      "Espacio para gestionar usuarios, información y procesos clave del conjunto desde un solo lugar.",
  },
  {
    icon: "ph-security-camera",
    title: "Control para vigilantes",
    copy:
      "Herramientas para registrar visitas y mantener mejor control de novedades en portería.",
  },
];

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <nav>
          <div className="nav-logo">
            <img src={safehomeLogo} alt="SafeHome" className="nav-logo-image" />
          </div>

          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hero-left">
          <div className="hero-text">
            <h1>
              La nueva forma de <br /> administrar tu conjunto residencial
            </h1>

            <p>
              Gestiona visitantes, residentes, comunicaciones y seguridad
              desde una sola plataforma moderna, rápida y confiable.
            </p>

            <Link to="/login" className="btn-primary">
              Iniciar sesión
            </Link>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-img-wrapper">
            <img src={homeHeroFamily} alt="Familia en la página principal de SafeHome" />
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="section-heading centered">
          <h2>Nuestros objetivos</h2>
          <div className="title-line"></div>
        </div>

        <div className="features-grid">
          {featureCards.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <i className={`ph-thin ${feature.icon} feat-icon`}></i>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="roles" id="roles">
        <div className="roles-inner">
          <div className="roles-text">
            <h2>Gestión de roles</h2>
            <p>
              La gestión de roles organiza a cada usuario según sus responsabilidades
              dentro del conjunto residencial.
            </p>
            <p>
              Así cada persona accede solo a las funciones que necesita y el sistema
              se mantiene más seguro, ordenado y fácil de usar.
            </p>
          </div>

          <div className="roles-cards-wrap">
            <div className="roles-cards">
              {roleCards.map((role) => (
                <div className="role-card" key={role.title}>
                  <div className="role-icon-box">
                    <i className={`ph-thin ${role.icon} role-icon-bare`}></i>
                  </div>
                  <h4>{role.title}</h4>
                  <p>{role.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="nosotros" id="nosotros">
        <div className="section-heading centered">
          <h2>Nosotros</h2>
          <div className="title-line"></div>
        </div>

        <div className="nosotros-box">
          {aboutColumns.map((column) => (
            <div className="nosotros-col" key={column.title}>
              <h3>{column.title}</h3>
              <p>{column.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="servicios" id="servicios">
        <div className="servicios-title">
          <h2>
            Nuestros
            <br />
            servicios
          </h2>
        </div>

        <div className="servicios-grid">
          {serviceCards.map((service) => (
            <div className="servicio-item" key={service.title}>
              <i className={`ph-thin ${service.icon} svc-icon-bare`}></i>
              <h4>{service.title}</h4>
              <p>{service.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          <img src={safehomeLogoWhite} alt="SafeHome" className="footer-logo-image" />
          <span className="copy">Copyright 2026 SafeHome</span>
        </div>

        <div className="footer-contact">
          <h4>Contacto</h4>

          <ul>
            <li>+57 321 294 6196</li>
            <li>safehome@gmail.com</li>
            <li>Cra. 24 #2 - 297, Madrid</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default Home;
