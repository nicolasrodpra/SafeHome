import { useState } from "react";
import "../styles/Registro_Vehiculos.css";
// ── Icons ────────────────────────────────────────────────────────────────────
const PQRIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const ReservasIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3" /><circle cx="16" cy="7" r="3" />
    <path d="M2 20c0-3.3 3.1-6 7-6" /><path d="M22 20c0-3.3-3.1-6-7-6" />
    <path d="M9 14c1-.3 2-.4 3-.4s2 .1 3 .4" />
  </svg>
);
const ComunicadosIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const ManualIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="12" height="20" rx="2" />
    <path d="M8 6h4M8 10h4M8 14h2" />
  </svg>
);
const ActualizarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 3h-8l-2 4h12l-2-4z" />
  </svg>
);
const PanicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="10" r="4" />
    <path d="M12 14v7" /><path d="M9 21h6" />
    <path d="M9 3l3-2 3 2" />
  </svg>
);
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const DeleteIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const EditIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const initialVehicles = [
  { id: 1, propietario: "Luis Stiven Pan", documento: "1027665943", placa: "RFM354", telefono: "3456789213", fecha: "23/05/2026",},
  { id: 2, propietario: "Luis Stiven Pan", documento: "1027665943", placa: "RFM354", telefono: "3456789213", fecha: "23/05/2026",},
  { id: 3, propietario: "Luis Stiven Pan", documento: "1027665943", placa: "RFM354", telefono: "3456789213", fecha: "23/05/2026", },
  { id: 3, propietario: "Luis Stiven Pan", documento: "1027665943", placa: "RFM354", telefono: "3456789213", fecha: "23/05/2026",},
  { id: 3, propietario: "Luis Stiven Pan", documento: "1027665943", placa: "RFM354", telefono: "3456789213", fecha: "23/05/2026",},
  { id: 3, propietario: "Luis Stiven Pan", documento: "1027665943", placa: "RFM354", telefono: "3456789213", fecha: "23/05/2026",},
  
];

const navItems = [
  { label: "PQR", icon: <PQRIcon /> },
  { label: "Reservas", icon: <ReservasIcon /> },
  { label: "Comunicados", icon: <ComunicadosIcon /> },
  { label: "Manual de convivencia", icon: <ManualIcon /> },
  { label: "Actualizar datos", icon: <ActualizarIcon /> },
  { label: "Botón Panico", icon: <PanicIcon /> },
];



export default function VehicleEntry() {
  const [vehicles] = useState(initialVehicles);
  const [activeNav, setActiveNav] = useState(null);


  return (
    
      <div className="app">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">SafeHome</div>

          <button className="create-btn">
            <span>Crear<br />nuevo correo</span>
            <span className="plus-circle"><PlusIcon /></span>
          </button>

          <ul className="nav-list">
            {navItems.map((item) => (
              <li
                key={item.label}
                className="nav-item"
                onClick={() => setActiveNav(item.label)}
                style={activeNav === item.label ? { background: "#f3e8ff", color: "#ff0000" } : {}}
              >
                {item.icon}
                {item.label}
              </li>
            ))}
          </ul>

          {/* Illustration */}
          <div className="sidebar-illustration">
            <span className="q-mark">?</span>
            <span className="figure" />
          </div>

          <div className="asistente-box">
            <span className="asistente-label">Asistente<br />virtual</span>
            <button className="iniciar-btn">Iniciar</button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          {/* Top bar */}
          <header className="topbar">
            <div className="topbar-left">
              <div className="location">Abundara</div>
              <div className="date">
                Lunes, <span>2 Marzo 2026</span>
              </div>
            </div>
            <div className="topbar-right">
              <button className="icon-btn"><MailIcon /></button>
              <button className="icon-btn"><BellIcon /></button>
              <div className="user-avatar">NR</div>
              <span className="user-name">
                Nicolas Rodriguez <ChevronDown />
              </span>
            </div>
          </header>

          {/* Content */}
          <main className="content">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Ingreso de Vehículos</h2>
                <button className="register-btn">
                  <span>Registrar nueva<br />correpondencia</span>
                  <span className="plus-sq"><PlusIcon /></span>
                </button>
              </div>

              <table className="vehicle-table">
                <thead>
                  <tr>
                    <th>Propietario</th>
                    <th>Documento</th>
                    <th>Placa</th>
                    <th>Telefono</th>
                    <th>Fecha de ingreso</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id} className={v.highlighted ? "highlighted" : ""}>
                      <td>{v.propietario}</td>
                      <td>{v.documento}</td>
                      <td>{v.placa}</td>
                      <td>{v.telefono}</td>
                      <td>{v.fecha}</td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="action-icon-btn delete"
                          
                            title="Eliminar"
                          >
                            <DeleteIcon />
                          </button>
                          <button
                            className="action-icon-btn"
                            title="Editar"
                          >
                            <EditIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    
  );
}