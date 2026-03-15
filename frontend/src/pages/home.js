import "../styles/home.css";

function Home() {
  return (
    <>

      <section className="hero">

        <nav>
          <div className="nav-logo">SAFEHOME</div>

          <ul className="nav-links">
            <li><a href="#features">Objetivos</a></li>
            <li><a href="#roles">Roles</a></li>
            <li><a href="#nosotros">Nosotros</a></li>
            <li><a href="#servicios">Servicios</a></li>
          </ul>
        </nav>

        <div className="hero-left">
          <div className="hero-text">
            <h1>
              La nueva forma de <br /> administrar tu conjunto residencial
            </h1>

            <p>
              Gestiona visitantes, residentes, comunicaciones y seguridad
              desde una sola plataforma moderna, rápida y confiable
            </p>

            <a href="/login" className="btn-primary">
              Iniciar Sesión
            </a>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-img-wrapper">
            <img src="/_Brochure.png" alt="SafeHome" />
          </div>
        </div>

      </section>


      <section className="features" id="features">

        <div className="section-heading centered">
          <h2>Nuestros Objetivos</h2>
          <div className="title-line"></div>
        </div>

        <div className="features-grid">

          <div className="feature-card">
            <i className="ph-thin ph-lock feat-icon"></i>
            <h3>Mayor Seguridad</h3>
            <p>
              Ofrecemos una mayor seguridad llevando un control rígido
              de los ingresos y salidas dentro del conjunto residencial.
            </p>
          </div>

          <div className="feature-card">
            <i className="ph-thin ph-chat-dots feat-icon"></i>
            <h3>Mejor Comunicación</h3>
            <p>
              Conectamos residentes, portería y administración mediante
              un aplicativo centralizado para una comunicación fluida.
            </p>
          </div>

          <div className="feature-card">
            <i className="ph-thin ph-clock feat-icon"></i>
            <h3>Mayor Agilidad</h3>
            <p>
              Automatizamos procesos como ingresos, autorizaciones y
              reportes para reducir tiempos de espera.
            </p>
          </div>

        </div>
      </section>


      <section className="roles" id="roles">

        <div className="roles-inner">

          <div className="roles-text">
            <h2>Gestión de Roles</h2>

            <p>
              La gestión de roles permite organizar a los usuarios según
              sus responsabilidades dentro del conjunto residencial.
            </p>

            <p>
              Define permisos según su rol, asegurando que cada uno
              acceda solo a las funciones necesarias. Esto mejora la
              seguridad, el orden y la agilidad en los procesos.
            </p>
          </div>


          <div className="roles-cards-wrap">

            <div className="roles-cards">

              <div className="role-card">
                <div className="role-icon-box">
                  <i className="ph-thin ph-user role-icon-bare"></i>
                </div>

                <h4>Administrador</h4>

                <p>
                  Encargado de gestionar el sistema, organizar documentos,
                  responder solicitudes y supervisar el funcionamiento
                  general del conjunto.
                </p>
              </div>


              <div className="role-card">
                <div className="role-icon-box">
                  <i className="ph-thin ph-house role-icon-bare"></i>
                </div>

                <h4>Residente</h4>

                <p>
                  Usuario que vive en el conjunto y puede hacer solicitudes,
                  reservas, consultar información y recibir notificaciones.
                </p>
              </div>


              <div className="role-card">
                <div className="role-icon-box">
                  <i className="ph-thin ph-eye role-icon-bare"></i>
                </div>

                <h4>Vigilante</h4>

                <p>
                  Responsable del control de accesos y la seguridad,
                  registrando visitas y apoyando al orden dentro del
                  conjunto residencial.
                </p>
              </div>

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

          <div className="nosotros-col">
            <h3>MISIÓN</h3>
            <p>
              Brindar una solución digital que mejore la organización,
              seguridad y agilidad en los conjuntos residenciales.
            </p>
          </div>

          <div className="nosotros-col">
            <h3>VISIÓN</h3>
            <p>
              Ser una aplicación reconocida por modernizar la gestión
              de conjuntos residenciales, destacándose por su seguridad
              y facilidad de uso.
            </p>
          </div>

          <div className="nosotros-col">
            <h3>¿QUIÉNES SOMOS?</h3>
            <p>
              Somos un equipo comprometido con mejorar la administración
              de conjuntos residenciales mediante el uso de tecnología.
            </p>
          </div>

        </div>

      </section>


      <section className="servicios" id="servicios">

        <div className="servicios-title">
          <h2>Nuestros<br />Servicios</h2>
        </div>


        <div className="servicios-grid">

          <div className="servicio-item">
            <i className="ph-thin ph-door-open svc-icon-bare"></i>
            <h4>Gestión de accesos</h4>
            <p>
              Control de entradas y salidas de residentes y visitantes
              para mejorar la seguridad del conjunto.
            </p>
          </div>

          <div className="servicio-item">
            <i className="ph-thin ph-paper-plane-tilt svc-icon-bare"></i>
            <h4>Gestión de solicitudes y PQRS</h4>
            <p>
              Los residentes pueden enviar solicitudes o reportes y
              recibir respuesta de manera ágil.
            </p>
          </div>

          <div className="servicio-item">
            <i className="ph-thin ph-calendar svc-icon-bare"></i>
            <h4>Reservas de zonas comunes</h4>
            <p>
              Permite apartar espacios como salones, canchas o piscinas
              de forma rápida.
            </p>
          </div>

          <div className="servicio-item">
            <i className="ph-thin ph-chats svc-icon-bare"></i>
            <h4>Comunicación interna</h4>
            <p>
              Canal directo entre residentes y administración para
              resolver dudas.
            </p>
          </div>

        </div>

      </section>


      <footer>

        <div className="footer-brand">
          <span className="logo-text">SAFEHOME</span>
          <span className="copy">
            Copyright © 2026 SafeHome
          </span>
        </div>

        <div className="footer-contact">
          <h4>Contacto</h4>

          <ul>
            <li>+57 321 294 6196</li>
            <li>safehome@gmail.com</li>
            <li>Cra 24 #2 - 297, Madrid</li>
          </ul>
        </div>

      </footer>

    </>
  );
}

export default Home;