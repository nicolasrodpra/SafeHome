import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import InternalLayout from "../../layouts/InternalLayout";
import {
  createVehiculo,
  deleteVehiculo,
  getVehiculos,
  updateVehiculo,
} from "../../services/modules/vigilanciaApi";
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

  if (!isOpen) return null;

  return (
    <div className="guard-modal-overlay" onClick={onClose}>
      <div className="guard-modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-stripe" />
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon">
              <i className="ph-light ph-car"></i>
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
          <button type="button" className="modal-close" onClick={onClose}>
            <i className="ph-light ph-x"></i>
          </button>
        </div>

        <hr className="modal-divider" />

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!validate()) return;
            onSave(form);
          }}
          className="modal-form"
        >
          <div className="form-row">
            <div className="form-group">
              <label>Propietario</label>
              <input
                value={form.propietario}
                onChange={(event) => setForm((prev) => ({ ...prev, propietario: event.target.value }))}
                placeholder="Nombre completo"
              />
              {errors.propietario && <span className="field-error">{errors.propietario}</span>}
            </div>

            <div className="form-group">
              <label>Documento</label>
              <input
                value={form.documento}
                onChange={(event) => setForm((prev) => ({ ...prev, documento: event.target.value }))}
                placeholder="Número de documento"
              />
              {errors.documento && <span className="field-error">{errors.documento}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Placa</label>
              <input
                value={form.placa}
                onChange={(event) => setForm((prev) => ({ ...prev, placa: event.target.value }))}
                placeholder="ABC123"
                className="input-placa"
              />
              {errors.placa && <span className="field-error">{errors.placa}</span>}
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                value={form.telefono}
                onChange={(event) => setForm((prev) => ({ ...prev, telefono: event.target.value }))}
                placeholder="Número de contacto"
              />
              {errors.telefono && <span className="field-error">{errors.telefono}</span>}
            </div>

            <div className="form-group">
              <label>Torre</label>
              <input
                value={form.torre}
                onChange={(event) => setForm((prev) => ({ ...prev, torre: event.target.value }))}
                placeholder="Torre"
              />
              {errors.torre && <span className="field-error">{errors.torre}</span>}
            </div>

            <div className="form-group">
              <label>Apartamento</label>
              <input
                value={form.apartamento}
                onChange={(event) => setForm((prev) => ({ ...prev, apartamento: event.target.value }))}
                placeholder="Apartamento"
              />
              {errors.apartamento && <span className="field-error">{errors.apartamento}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de vehículo</label>
              <select
                value={form.tipo}
                onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
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
              {loading ? "Guardando..." : editingVehicle ? "Actualizar" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegistroVehiculos() {
  const [vehicles, setVehicles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadVehicles = async () => {
    try {
      const data = await getVehiculos();
      setVehicles(data);
    } catch (error) {
      setVehicles([]);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const totalCarros = vehicles.filter((vehicle) => vehicle.tipo === "Carro").length;
  const totalMotos = vehicles.filter((vehicle) => vehicle.tipo === "Moto").length;

  const handleSave = async (formData) => {
    setLoadingForm(true);

    try {
      if (editingVehicle) {
        await updateVehiculo(editingVehicle.id, formData);
      } else {
        await createVehiculo(formData);
      }

      await loadVehicles();
      setEditingVehicle(null);
      setModalOpen(false);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Ocurrió un error al guardar.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setLoadingForm(false);
    }
  };

  const handleDelete = async (vehicle) => {
    const result = await Swal.fire({
      title: "¿Eliminar vehículo?",
      text: `Se eliminará el vehículo de ${vehicle.propietario} (${vehicle.placa}).`,
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
      await deleteVehiculo(vehicle.id);
      await loadVehicles();

      Swal.fire({
        title: "Vehículo eliminado",
        text: "El registro fue eliminado correctamente.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo eliminar el registro.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <InternalLayout>
      <main className="content guard-module-page">
        <header className="guard-module-page-header">
          <div>
            <h1 className="internal-page-title">Registro de vehículos</h1>
            <p className="guard-module-page-copy">
              Controla el ingreso de carros y motos desde una vista más clara, simple y consistente
              con el resto del sistema.
            </p>
          </div>

          <div className="guard-module-summary">
            <span>Total de registros</span>
            <strong>{vehicles.length}</strong>
          </div>
        </header>

        <section className="card guard-module-surface">
          <div className="card-header guard-module-card-header">
            <div className="guard-module-head-copy">
              <h2 className="card-title">Resumen operativo</h2>
              <p className="guard-module-card-copy">
                Consulta, crea y edita los vehículos autorizados para mantener el control del turno
                al día.
              </p>
            </div>

            <div className="guard-module-header-tools">
              <div className="vehicle-counters">
                <div className="counter-card">
                  <div className="counter-icon car">
                    <i className="ph-light ph-car"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalCarros}</span>
                    <span className="counter-label">Carros</span>
                  </div>
                </div>

                <div className="counter-card">
                  <div className="counter-icon moto">
                    <i className="ph-light ph-motorcycle"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalMotos}</span>
                    <span className="counter-label">Motos</span>
                  </div>
                </div>
              </div>

              <button type="button" className="register-btn" onClick={() => setModalOpen(true)}>
                <span>
                  Registrar nuevo
                  <br />
                  vehículo
                </span>
                <span className="plus-sq"></span>
              </button>
            </div>
          </div>

          <div className="guard-module-table-wrap">
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
                    <td colSpan={10} className="guard-module-empty-row">
                      No hay vehículos registrados.
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
                            onClick={() => {
                              setEditingVehicle(vehicle);
                              setModalOpen(true);
                            }}
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
        </section>
      </main>

      <VehicleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingVehicle(null);
        }}
        onSave={handleSave}
        editingVehicle={editingVehicle}
        loading={loadingForm}
      />
    </InternalLayout>
  );
}
