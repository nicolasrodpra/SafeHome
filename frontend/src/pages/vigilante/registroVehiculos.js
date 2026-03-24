import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import "../../styles/vigilante/registroVehiculos.css";

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
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const CarIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m20.77 9.16l-1.37-4.1a2.99 2.99 0 0 0-2.85-2.05H7.44a3 3 0 0 0-2.85 2.05l-1.37 4.1c-.72.3-1.23 1.02-1.23 1.84v5a2 2 0 0 0 1 1.72V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-2h12v2c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-2.28a2 2 0 0 0 1-1.72v-5c0-.83-.51-1.54-1.23-1.84ZM19 13.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5s1.5.67 1.5 1.5m-11 0c0 .83-.67 1.5-1.5 1.5S5 14.33 5 13.5S5.67 12 6.5 12s1.5.67 1.5 1.5M20 11v5zM7.44 5h9.12a1 1 0 0 1 .95.68L18.62 9H5.39L6.5 5.68A1 1 0 0 1 7.45 5Z"/></svg>);
const MotoIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256"><path fill="currentColor" d="M216 120a41 41 0 0 0-6.6.55l-5.82-15.14A55.6 55.6 0 0 1 216 104a8 8 0 0 0 0-16h-19.12l-13.41-34.87A8 8 0 0 0 176 48h-32a8 8 0 0 0 0 16h26.51l9.23 24H152c-18.5 0-33.5 4.31-43.37 12.46a16 16 0 0 1-16.76 2.07c-10.58-4.81-73.29-30.12-73.8-30.26a8 8 0 0 0-5 15.19s55.5 21.94 66.53 32.94A55.67 55.67 0 0 1 95.43 152H79.2a40 40 0 1 0 0 16h52.12a31.91 31.91 0 0 0 30.74-23.1a56 56 0 0 1 26.59-33.72l5.82 15.13A40 40 0 1 0 216 120M40 168h22.62a24 24 0 1 1 0-16H40a8 8 0 0 0 0 16m176 16a24 24 0 0 1-15.58-42.23l8.11 21.1a8 8 0 1 0 14.94-5.74L215.35 136h.65a24 24 0 0 1 0 48"/></svg>
);

const EMPTY_FORM = {
  propietario: "",
  documento: "",
  placa: "",
  telefono: "",
  torre: "",
  apartamento: "",
  tipo: "",
};

const navItems = [
  { label: "PQR", icon: <PQRIcon /> },
  { label: "Reservas", icon: <ReservasIcon /> },
  { label: "Comunicados", icon: <ComunicadosIcon /> },
  { label: "Manual de convivencia", icon: <ManualIcon /> },
  { label: "Actualizar datos", icon: <ActualizarIcon /> },
  { label: "Botón Panico", icon: <PanicIcon /> },
];

function VehicleModal({ isOpen, onClose, onSave, editingVehicle, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingVehicle) {
      setForm({
        propietario: editingVehicle.propietario,
        documento: editingVehicle.documento,
        placa: editingVehicle.placa,
        telefono: editingVehicle.telefono,
        torre: editingVehicle.torre,
        apartamento: editingVehicle.apartamento,
        tipo: editingVehicle.tipo,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editingVehicle, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.propietario.trim()) e.propietario = "Requerido";
    if (!form.documento.trim()) e.documento = "Requerido";
    if (!form.placa.trim()) e.placa = "Requerido";
    if (!form.telefono.trim()) e.telefono = "Requerido";
    if (!form.torre.trim()) e.torre = "Requerido";
    if (!form.apartamento.trim()) e.apartamento = "Requerido";
    if (!form.tipo) e.tipo = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        <div className="modal-stripe" />

        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">
              <CarIcon />
            </div>
            <div>
              <p className="modal-title">
                {editingVehicle ? "Editar vehículo" : "Registrar vehículo"}
              </p>
              <p className="modal-subtitle">
                {editingVehicle
                  ? "Modifica los datos del vehículo"
                  : "Completa los datos del propietario"}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Cerrar">
            <CloseIcon />
          </button>
        </div>

        <hr className="modal-divider" />

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Propietario</label>
              <input
                name="propietario"
                value={form.propietario}
                onChange={handleChange}
                placeholder="Nombre completo"
              />
              {errors.propietario && <span className="field-error">{errors.propietario}</span>}
            </div>
            <div className="form-group">
              <label>Documento</label>
              <input
                name="documento"
                value={form.documento}
                onChange={handleChange}
                placeholder="Número de documento"
              />
              {errors.documento && <span className="field-error">{errors.documento}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Placa</label>
              <input
                name="placa"
                value={form.placa}
                onChange={handleChange}
                placeholder="ABC123"
              />
              {errors.placa && <span className="field-error">{errors.placa}</span>}
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Número de contacto"
              />
              {errors.telefono && <span className="field-error">{errors.telefono}</span>}
            </div>
            <div className="form-group">
              <label>Torre</label>
              <input
                name="torre"
                value={form.torre}
                onChange={handleChange}
                placeholder="Torre"
              />
              {errors.torre && <span className="field-error">{errors.torre}</span>}
            </div>
            <div className="form-group">
              <label>Apartamento</label>
              <input
                name="apartamento"
                value={form.apartamento}
                onChange={handleChange}
                placeholder="Apartamento"
              />
              {errors.apartamento && <span className="field-error">{errors.apartamento}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de vehículo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
              >
                <option value="">Seleccionar...</option>
                <option value="Carro">Carro</option>
                <option value="Moto">Moto</option>
              </select>
              {errors.tipo && <span className="field-error">{errors.tipo}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              <PlusIcon />
              {loading ? "Guardando..." : editingVehicle ? "Actualizar" : "Registrar vehículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehicleEntry() {
  const [vehicles, setVehicles] = useState([]);
  const [activeNav, setActiveNav] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const totalCarros = vehicles.filter((v) => v.tipo === "Carro").length;
  const totalMotos = vehicles.filter((v) => v.tipo === "Moto").length;

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "vehiculos"),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          fecha: d.data().fecha?.toDate
            ? d.data().fecha.toDate().toLocaleDateString("es-CO")
            : d.data().fecha ?? "",
          hora: d.data().fecha?.toDate
            ? d.data().fecha.toDate().toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        }));
        setVehicles(data);
      },
      (error) => {
        console.error("Error leyendo vehículos:", error);
      }
    );
    return () => unsub();
  }, []);

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    setLoadingForm(true);
    try {
      if (editingVehicle) {
        const ref = doc(db, "vehiculos", editingVehicle.id);
        await updateDoc(ref, {
          ...formData,
          placa: formData.placa.toUpperCase(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "vehiculos"), {
          ...formData,
          placa: formData.placa.toUpperCase(),
          fecha: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Error guardando vehículo:", err);
      alert("Ocurrió un error al guardar. Revisa la consola.");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleDelete = async (vehicle) => {
    const confirmar = window.confirm(
      `¿Eliminar el vehículo de ${vehicle.propietario} (${vehicle.placa})?`
    );
    if (!confirmar) return;

    setDeletingId(vehicle.id);
    try {
      await deleteDoc(doc(db, "vehiculos", vehicle.id));
    } catch (err) {
      console.error("Error eliminando vehículo:", err);
      alert("No se pudo eliminar. Revisa la consola.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="app">
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
              style={activeNav === item.label ? { background: "#f3e8ff", color: "#7c3aed" } : {}}
            >
              {item.icon}
              {item.label}
            </li>
          ))}
        </ul>

        <div className="asistente-box">
          <span className="asistente-label">Asistente<br />virtual</span>
          <button className="iniciar-btn">Iniciar</button>
        </div>
      </aside>

      <div className="main">
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
            <span className="user-name">Nicolas Rodriguez <ChevronDown /></span>
          </div>
        </header>

        <main className="content">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Ingreso de Vehículos</h2>
              <div className="vehicle-counters">
              <div className="counter-card">
                <div className="counter-icon car">
                  <CarIcon />
                </div>
                <div className="counter-info">
                  <span className="counter-number">{totalCarros}</span>
                </div>
              </div>
              <div className="counter-card">
                <div className="counter-icon moto">
                  <MotoIcon />
                </div>
                <div className="counter-info">
                  <span className="counter-number">{totalMotos}</span>
                </div>
              </div>
            </div>
              <button className="register-btn" onClick={handleOpenCreate}>
                <span>Registrar nuevo<br />vehículo</span>
                <span className="plus-sq"><PlusIcon /></span>
              </button>
            </div>


            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Propietario</th>
                  <th>Documento</th>
                  <th>Placa</th>
                  <th>Teléfono</th>
                  <th>Torre</th>
                  <th>Apartamento</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "24px", color: "#999" }}>
                      No hay vehículos registrados
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id}>
                      {/* Icono según tipo */}
                      <td>
                        <div className={`tipo-icon ${v.tipo === "Moto" ? "moto" : "car"}`}>
                          {v.tipo === "Moto" ? <MotoIcon /> : <CarIcon />}
                        </div>
                      </td>
                      <td>{v.propietario}</td>
                      <td>{v.documento}</td>
                      <td>{v.placa}</td>
                      <td>{v.telefono}</td>
                      <td>{v.torre}</td>
                      <td>{v.apartamento}</td>
                      <td>{v.fecha}</td>
                      <td>{v.hora}</td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="action-icon-btn delete"
                            title="Eliminar"
                            disabled={deletingId === v.id}
                            onClick={() => handleDelete(v)}
                          >
                            {deletingId === v.id ? "..." : <DeleteIcon />}
                          </button>
                          <button
                            className="action-icon-btn"
                            title="Editar"
                            onClick={() => handleOpenEdit(v)}
                          >
                            <EditIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <VehicleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingVehicle={editingVehicle}
        loading={loadingForm}
      />
    </div>
  );
}