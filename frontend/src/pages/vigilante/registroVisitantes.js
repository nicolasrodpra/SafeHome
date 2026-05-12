// Módulo operativo de visitantes.
// Permite registrar, editar y eliminar ingresos autorizados del día.
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import InternalLayout from "../../layouts/InternalLayout";
import {
  createVisitante,
  deleteVisitante,
  getVisitantes,
  updateVisitante,
} from "../../services/modules/vigilanciaApi";
import "../../styles/vigilante/registroVisitantes.css";

const EMPTY_FORM = {
  nombre: "",
  documento: "",
  residente: "",
  torre: "",
  apartamento: "",
  motivo: "",
  telefono: "",
};

function VisitanteModal({ isOpen, onClose, onSave, editingVisitor, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingVisitor) {
      setForm({
        nombre: editingVisitor.nombre,
        documento: editingVisitor.documento,
        residente: editingVisitor.residente,
        torre: editingVisitor.torre,
        apartamento: editingVisitor.apartamento,
        motivo: editingVisitor.motivo,
        telefono: editingVisitor.telefono,
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setErrors({});
  }, [editingVisitor, isOpen]);

  const validate = () => {
    const nextErrors = {};

    if (!form.nombre.trim()) nextErrors.nombre = "Requerido";
    if (!form.documento.trim()) nextErrors.documento = "Requerido";
    else if (!/^\d+$/.test(form.documento.trim())) nextErrors.documento = "Solo numeros";
    if (!form.residente.trim()) nextErrors.residente = "Requerido";
    if (!form.torre.trim()) nextErrors.torre = "Requerido";
    if (!form.apartamento.trim()) nextErrors.apartamento = "Requerido";
    if (!form.motivo.trim()) nextErrors.motivo = "Requerido";
    if (!form.telefono.trim()) nextErrors.telefono = "Requerido";
    else if (!/^\d+$/.test(form.telefono.trim())) nextErrors.telefono = "Solo numeros";

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
              <i className="ph-light ph-users-three"></i>
            </div>
            <div>
              <p className="modal-title">
                {editingVisitor ? "Editar visitante" : "Registrar visitante"}
              </p>
              <p className="modal-subtitle">
                {editingVisitor
                  ? "Actualiza el ingreso del visitante"
                  : "Completa los datos del visitante autorizado"}
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
              <label>Visitante</label>
              <input
                value={form.nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                placeholder="Nombre completo"
              />
              {errors.nombre && <span className="field-error">{errors.nombre}</span>}
            </div>

            <div className="form-group">
              <label>Documento</label>
              <input
                value={form.documento}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    documento: event.target.value.replace(/\D+/g, ""),
                  }))
                }
                inputMode="numeric"
                placeholder="Número de documento"
              />
              {errors.documento && <span className="field-error">{errors.documento}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Residente que autoriza</label>
              <input
                value={form.residente}
                onChange={(event) => setForm((prev) => ({ ...prev, residente: event.target.value }))}
                placeholder="Nombre del residente"
              />
              {errors.residente && <span className="field-error">{errors.residente}</span>}
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                value={form.telefono}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    telefono: event.target.value.replace(/\D+/g, ""),
                  }))
                }
                inputMode="numeric"
                placeholder="Número de contacto"
              />
              {errors.telefono && <span className="field-error">{errors.telefono}</span>}
            </div>
          </div>

          <div className="form-row">
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

          <div className="form-row form-row-single">
            <div className="form-group">
              <label>Motivo de visita</label>
              <input
                value={form.motivo}
                onChange={(event) => setForm((prev) => ({ ...prev, motivo: event.target.value }))}
                placeholder="Ej. visita familiar, mantenimiento"
              />
              {errors.motivo && <span className="field-error">{errors.motivo}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Guardando..." : editingVisitor ? "Actualizar" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegistroVisitantes() {
  const [visitors, setVisitors] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadVisitors = async () => {
    try {
      const data = await getVisitantes();
      setVisitors(data);
    } catch (error) {
      setVisitors([]);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  const handleSave = async (formData) => {
    setLoadingForm(true);

    try {
      if (editingVisitor) {
        await updateVisitante(editingVisitor.id, formData);
      } else {
        await createVisitante(formData);
      }

      await loadVisitors();
      setEditingVisitor(null);
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

  const handleDelete = async (visitor) => {
    const result = await Swal.fire({
      title: "¿Eliminar visitante?",
      text: `Se eliminará el ingreso registrado para ${visitor.nombre}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b42318",
      cancelButtonColor: "#460669",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setDeletingId(visitor.id);

    try {
      await deleteVisitante(visitor.id);
      await loadVisitors();

      Swal.fire({
        title: "Visitante eliminado",
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
            <h1 className="internal-page-title">Registro de visitantes</h1>
            <p className="guard-module-page-copy">
              Gestiona los ingresos autorizados con una vista más ordenada para registrar, editar y
              consultar visitantes del conjunto.
            </p>
          </div>

          <div className="guard-module-summary">
            <span>Total de registros</span>
            <strong>{visitors.length}</strong>
          </div>
        </header>

        <section className="card guard-module-surface">
          <div className="card-header guard-module-card-header">
            <div className="guard-module-head-copy">
              <h2 className="card-title">Resumen operativo</h2>
              <p className="guard-module-card-copy">
                Mantén trazabilidad de los ingresos del día desde una interfaz más limpia y fácil
                de revisar.
              </p>
            </div>

            <div className="guard-module-header-tools">
              <div className="vehicle-counters">
                <div className="counter-card">
                  <div className="counter-icon car">
                    <i className="ph-light ph-users-three"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{visitors.length}</span>
                    <span className="counter-label">Visitantes</span>
                  </div>
                </div>
              </div>

              <button type="button" className="register-btn" onClick={() => setModalOpen(true)}>
                <span>
                  Registrar nuevo
                  <br />
                  visitante
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
                  <th>Visitante</th>
                  <th>Documento</th>
                  <th>Residente</th>
                  <th>Teléfono</th>
                  <th>Torre</th>
                  <th>Apartamento</th>
                  <th>Motivo</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {visitors.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="guard-module-empty-row">
                      No hay visitantes registrados.
                    </td>
                  </tr>
                ) : (
                  visitors.map((visitor) => (
                    <tr key={visitor.id}>
                      <td>
                        <div
                          className={`tipo-icon ${
                            visitor.motivo?.toLowerCase().includes("familiar") ? "moto" : "car"
                          }`}
                        >
                          <i
                            className={`ph-light ${
                              visitor.motivo?.toLowerCase().includes("familiar")
                                ? "ph-hand-heart"
                                : "ph-user"
                            }`}
                          ></i>
                        </div>
                      </td>
                      <td>{visitor.nombre}</td>
                      <td>{visitor.documento}</td>
                      <td>{visitor.residente}</td>
                      <td>{visitor.telefono}</td>
                      <td>{visitor.torre}</td>
                      <td>{visitor.apartamento}</td>
                      <td>{visitor.motivo}</td>
                      <td>{visitor.fecha}</td>
                      <td>{visitor.hora}</td>
                      <td>
                        <div className="action-btns">
                          <button
                            type="button"
                            className="action-icon-btn delete"
                            disabled={deletingId === visitor.id}
                            onClick={() => handleDelete(visitor)}
                          >
                            {deletingId === visitor.id ? "..." : <i className="ph-light ph-trash"></i>}
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn"
                            onClick={() => {
                              setEditingVisitor(visitor);
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

      <VisitanteModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingVisitor(null);
        }}
        onSave={handleSave}
        editingVisitor={editingVisitor}
        loading={loadingForm}
      />
    </InternalLayout>
  );
}
