import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import asistenteVirtual from "../../assets/asistenteVirtual.png";
import { db } from "../FireBase/firebase";
import { cerrarSesion } from "../../services/authService";
import { getFechaActual } from "../../services/getDate";
import "../../styles/vigilante/registroVehiculos.css";

const EMPTY_FORM = {
  propietario: "",
  documento: "",
  placa: "",
  telefono: "",
  torre: "",
  apartamento: "",
  tipo: "",
};

const sidebarItems = [
  { icon: "ph-megaphone", label: "Quejas" },
  { icon: "ph-calendar-blank", label: "Reservas" },
  { icon: "ph-bell", label: "Comunicados", to: "/adminComunicados" },
  { icon: "ph-security-camera", label: "Vigilancia", to: "/registroVehiculos" },
  { icon: "ph-user", label: "Residentes" },
  { icon: "ph-book-bookmark", label: "Manual Convivencia" },
  { icon: "ph-pencil-simple", label: "Actualizar datos" },
  { icon: "ph-user-plus", label: "Registrar Usuario", to: "/registroResidente" },
];

function SidebarItem({ item }) {
  if (item.to) {
    return (
      <Link to={item.to}>
        <i className={`ph-light ${item.icon}`}></i> {item.label}
      </Link>
    );
  }

  return (
    <span className="sidebar-link-placeholder">
      <i className={`ph-light ${item.icon}`}></i> {item.label}
    </span>
  );
}

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
    const nextErrors = {};

    if (!form.propietario.trim()) nextErrors.propietario = "Requerido";
    if (!form.documento.trim()) nextErrors.documento = "Requerido";
    if (!form.placa.trim()) nextErrors.placa = "Requerido";
    if (!form.telefono.trim()) nextErrors.telefono = "Requerido";
    if (!form.torre.trim()) nextErrors.torre = "Requerido";
    if (!form.apartamento.trim()) nextErrors.apartamento = "Requerido";
    if (!form.tipo) nextErrors.tipo = "Requerido";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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
              <i className="ph-light ph-car"></i>
            </div>
            <div>
              <p className="modal-title">
                {editingVehicle ? "Editar vehiculo" : "Registrar vehiculo"}
              </p>
              <p className="modal-subtitle">
                {editingVehicle
                  ? "Modifica los datos del vehiculo"
                  : "Completa los datos del propietario"}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <i className="ph-light ph-x"></i>
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
                placeholder="Numero de documento"
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
                className="input-placa"
              />
              {errors.placa && <span className="field-error">{errors.placa}</span>}
            </div>

            <div className="form-group">
              <label>Telefono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Numero de contacto"
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
              <label>Tipo de vehiculo</label>
              <select name="tipo" value={form.tipo} onChange={handleChange}>
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
              <i className={`ph-light ${editingVehicle ? "ph-floppy-disk" : "ph-plus"}`}></i>
              {loading ? "Guardando..." : editingVehicle ? "Actualizar" : "Registrar vehiculo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehicleEntry() {
  const navigate = useNavigate();
  const fechaMayuscula = getFechaActual();
  const [vehicles, setVehicles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const totalCarros = vehicles.filter((vehicle) => vehicle.tipo === "Carro").length;
  const totalMotos = vehicles.filter((vehicle) => vehicle.tipo === "Moto").length;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "vehiculos"),
      (snapshot) => {
        const data = snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
          fecha: snapshotDoc.data().fecha?.toDate
            ? snapshotDoc.data().fecha.toDate().toLocaleDateString("es-CO")
            : snapshotDoc.data().fecha ?? "",
          hora: snapshotDoc.data().fecha?.toDate
            ? snapshotDoc.data().fecha.toDate().toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        }));

        setVehicles(data);
      },
      (error) => {
        console.error("Error cargando vehiculos:", error);
      }
    );

    return () => unsubscribe();
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
        const res = await fetch(`http://localhost:5000/api/vehiculos/${editingVehicle.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.mensaje);

        setVehicles((prev) =>
          prev.map((vehicle) =>
            vehicle.id === editingVehicle.id ? { ...vehicle, ...data.vehiculo } : vehicle
          )
        );
      } else {
        const res = await fetch("http://localhost:5000/api/vehiculos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.mensaje);

        setVehicles((prev) => [...prev, data.vehiculo]);
      }

      setEditingVehicle(null);
      setModalOpen(false);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrio un error al guardar.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setLoadingForm(false);
    }
  };

  const handleDelete = async (vehicle) => {
    const result = await Swal.fire({
      title: "Eliminar vehiculo?",
      text: `Se eliminara el vehiculo de ${vehicle.propietario} (${vehicle.placa}).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b42318",
      cancelButtonColor: "#460669",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setDeletingId(vehicle.id);

    try {
      const res = await fetch(`http://localhost:5000/api/vehiculos/${vehicle.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("No se pudo eliminar.");

      setVehicles((prev) => prev.filter((currentVehicle) => currentVehicle.id !== vehicle.id));

      Swal.fire({
        title: "Vehiculo eliminado",
        text: "El registro fue eliminado correctamente.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <Link to="/adminMenu" className="sidebar-logo">
          SafeHome
        </Link>

        <ul className="nav-menu">
          {sidebarItems.map((item) => (
            <li key={item.label}>
              <SidebarItem item={item} />
            </li>
          ))}

          <div className="sidebar-assistant">
            <img src={asistenteVirtual} alt="asistenteVirtual" />
            <p>
              Asistente
              <br />
              Virtual
            </p>
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
            <i
              className="ph-light ph-sign-out topbar-icon"
              onClick={() => cerrarSesion(navigate)}
            ></i>
            <div className="user-pill">
              <div className="user-avatar">NR</div>
              <span className="user-name">Nicolas Rodriguez</span>
              <i className="ph-light ph-caret-down user-caret"></i>
            </div>
          </div>
        </div>

        <main className="content">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Ingreso de Vehiculos</h2>

              <div className="vehicle-counters">
                <div className="counter-card">
                  <div className="counter-icon car">
                    <i className="ph-light ph-car"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalCarros}</span>
                  </div>
                </div>

                <div className="counter-card">
                  <div className="counter-icon moto">
                    <i className="ph-light ph-motorcycle"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalMotos}</span>
                  </div>
                </div>
              </div>

              <button type="button" className="register-btn" onClick={handleOpenCreate}>
                <span>
                  Registrar nuevo
                  <br />
                  vehiculo
                </span>
                <span className="plus-sq"></span>
              </button>
            </div>

            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Propietario</th>
                  <th>Documento</th>
                  <th>Placa</th>
                  <th>Telefono</th>
                  <th>Torre</th>
                  <th>Apartamento</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "24px", color: "#999" }}>
                      No hay vehiculos registrados
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>
                        <div className={`tipo-icon ${vehicle.tipo === "Moto" ? "moto" : "car"}`}>
                          <i
                            className={`ph-light ${
                              vehicle.tipo === "Moto" ? "ph-motorcycle" : "ph-car"
                            }`}
                          ></i>
                        </div>
                      </td>
                      <td>{vehicle.propietario}</td>
                      <td>{vehicle.documento}</td>
                      <td>{vehicle.placa}</td>
                      <td>{vehicle.telefono}</td>
                      <td>{vehicle.torre}</td>
                      <td>{vehicle.apartamento}</td>
                      <td>{vehicle.fecha}</td>
                      <td>{vehicle.hora}</td>
                      <td>
                        <div className="action-btns">
                          <button
                            type="button"
                            className="action-icon-btn delete"
                            disabled={deletingId === vehicle.id}
                            onClick={() => handleDelete(vehicle)}
                          >
                            {deletingId === vehicle.id ? "..." : <i className="ph-light ph-trash"></i>}
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn"
                            onClick={() => handleOpenEdit(vehicle)}
                          >
                            <i className="ph-light ph-pencil-simple"></i>
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
