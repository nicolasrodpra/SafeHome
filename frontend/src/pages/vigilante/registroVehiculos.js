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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 3h-8l-2 4h12l-2-4z" />
  </svg>
);

const EMPTY_FORM = {
  propietario: "",
  documento: "",
  placa: "",
  telefono: "",
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
                className="input-placa"
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

// ── Main component ─────────────────────────────────────────────────────────
export default function VehicleEntry() {
  const [vehicles, setVehicles] = useState([]);
  const [activeNav, setActiveNav] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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
              style={activeNav === item.label ? { background: "#f3e8ff", color: "#7c3aed" } : {}}
            >
              {item.icon}
              {item.label}
            </li>
          ))}
        </ul>

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
              <button className="register-btn" onClick={handleOpenCreate}>
                <span>Registrar nuevo<br />vehículo</span>
                <span className="plus-sq"><PlusIcon /></span>
              </button>
            </div>

            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Propietario</th>
                  <th>Documento</th>
                  <th>Placa</th>
                  <th>Teléfono</th>
                  <th>Fecha de ingreso</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#999" }}>
                      No hay vehículos registrados
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id}>
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