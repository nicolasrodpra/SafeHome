import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import InternalLayout from "../../layouts/InternalLayout";
import {
  createCorrespondencia,
  deleteCorrespondencia,
  getCorrespondencia,
  updateCorrespondencia,
} from "../../services/modules/vigilanciaApi";
import "../../styles/vigilante/registroCorrespondencia.css";

const EMPTY_FORM = {
  residente: "",
  documento: "",
  torre: "",
  apartamento: "",
  tipoEntrega: "",
  remitente: "",
  observacion: "",
};

function CorrespondenciaModal({ isOpen, onClose, onSave, editingItem, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingItem) {
      setForm({
        residente: editingItem.residente,
        documento: editingItem.documento,
        torre: editingItem.torre,
        apartamento: editingItem.apartamento,
        tipoEntrega: editingItem.tipoEntrega,
        remitente: editingItem.remitente,
        observacion: editingItem.observacion,
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setErrors({});
  }, [editingItem, isOpen]);

  const validate = () => {
    const nextErrors = {};

    if (!form.residente.trim()) nextErrors.residente = "Requerido";
    if (!form.documento.trim()) nextErrors.documento = "Requerido";
    if (!form.torre.trim()) nextErrors.torre = "Requerido";
    if (!form.apartamento.trim()) nextErrors.apartamento = "Requerido";
    if (!form.tipoEntrega) nextErrors.tipoEntrega = "Requerido";
    if (!form.remitente.trim()) nextErrors.remitente = "Requerido";
    if (!form.observacion.trim()) nextErrors.observacion = "Requerido";

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
              <i className="ph-light ph-package"></i>
            </div>
            <div>
              <p className="modal-title">
                {editingItem ? "Editar correspondencia" : "Registrar correspondencia"}
              </p>
              <p className="modal-subtitle">
                {editingItem
                  ? "Actualiza la entrega registrada"
                  : "Guarda el paquete o documento recibido"}
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
              <label>Residente</label>
              <input
                name="residente"
                value={form.residente}
                onChange={(event) => setForm((prev) => ({ ...prev, residente: event.target.value }))}
                placeholder="Nombre completo"
              />
              {errors.residente && <span className="field-error">{errors.residente}</span>}
            </div>

            <div className="form-group">
              <label>Documento</label>
              <input
                name="documento"
                value={form.documento}
                onChange={(event) => setForm((prev) => ({ ...prev, documento: event.target.value }))}
                placeholder="Número de documento"
              />
              {errors.documento && <span className="field-error">{errors.documento}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Torre</label>
              <input
                name="torre"
                value={form.torre}
                onChange={(event) => setForm((prev) => ({ ...prev, torre: event.target.value }))}
                placeholder="Torre"
              />
              {errors.torre && <span className="field-error">{errors.torre}</span>}
            </div>

            <div className="form-group">
              <label>Apartamento</label>
              <input
                name="apartamento"
                value={form.apartamento}
                onChange={(event) => setForm((prev) => ({ ...prev, apartamento: event.target.value }))}
                placeholder="Apartamento"
              />
              {errors.apartamento && <span className="field-error">{errors.apartamento}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de entrega</label>
              <select
                name="tipoEntrega"
                value={form.tipoEntrega}
                onChange={(event) => setForm((prev) => ({ ...prev, tipoEntrega: event.target.value }))}
              >
                <option value="">Seleccionar...</option>
                <option value="Paquete">Paquete</option>
                <option value="Sobre">Sobre</option>
                <option value="Documento">Documento</option>
              </select>
              {errors.tipoEntrega && <span className="field-error">{errors.tipoEntrega}</span>}
            </div>

            <div className="form-group">
              <label>Remitente</label>
              <input
                name="remitente"
                value={form.remitente}
                onChange={(event) => setForm((prev) => ({ ...prev, remitente: event.target.value }))}
                placeholder="Empresa o persona"
              />
              {errors.remitente && <span className="field-error">{errors.remitente}</span>}
            </div>
          </div>

          <div className="form-row form-row-single">
            <div className="form-group">
              <label>Observación</label>
              <input
                name="observacion"
                value={form.observacion}
                onChange={(event) => setForm((prev) => ({ ...prev, observacion: event.target.value }))}
                placeholder="Detalles de la entrega"
              />
              {errors.observacion && <span className="field-error">{errors.observacion}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Guardando..." : editingItem ? "Actualizar" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegistroCorrespondencia() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadItems = async () => {
    try {
      const data = await getCorrespondencia();
      setItems(data);
    } catch (error) {
      setItems([]);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const totalPaquetes = items.filter((item) => item.tipoEntrega === "Paquete").length;
  const totalSobres = items.filter((item) => item.tipoEntrega === "Sobre").length;
  const totalDocumentos = items.filter((item) => item.tipoEntrega === "Documento").length;

  const handleSave = async (formData) => {
    setLoadingForm(true);

    try {
      if (editingItem) {
        await updateCorrespondencia(editingItem.id, formData);
      } else {
        await createCorrespondencia(formData);
      }

      await loadItems();
      setEditingItem(null);
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

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "¿Eliminar correspondencia?",
      text: `Se eliminará la entrega registrada para ${item.residente}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b42318",
      cancelButtonColor: "#460669",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setDeletingId(item.id);

    try {
      await deleteCorrespondencia(item.id);
      await loadItems();

      Swal.fire({
        title: "Correspondencia eliminada",
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
            <h1 className="internal-page-title">Registro de correspondencia</h1>
            <p className="guard-module-page-copy">
              Lleva el control de paquetes, sobres y documentos con una vista más limpia y
              operativa para vigilancia.
            </p>
          </div>

          <div className="guard-module-summary">
            <span>Total de registros</span>
            <strong>{items.length}</strong>
          </div>
        </header>

        <section className="card guard-module-surface">
          <div className="card-header guard-module-card-header">
            <div className="guard-module-head-copy">
              <h2 className="card-title">Resumen operativo</h2>
              <p className="guard-module-card-copy">
                Organiza las entregas registradas y actualiza rápidamente cualquier novedad del
                módulo.
              </p>
            </div>

            <div className="guard-module-header-tools">
              <div className="vehicle-counters">
                <div className="counter-card">
                  <div className="counter-icon car">
                    <i className="ph-light ph-package"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalPaquetes}</span>
                    <span className="counter-label">Paquetes</span>
                  </div>
                </div>

                <div className="counter-card">
                  <div className="counter-icon moto">
                    <i className="ph-light ph-envelope-simple"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalSobres}</span>
                    <span className="counter-label">Sobres</span>
                  </div>
                </div>

                <div className="counter-card">
                  <div className="counter-icon moto">
                    <i className="ph-light ph-file-text"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalDocumentos}</span>
                    <span className="counter-label">Documentos</span>
                  </div>
                </div>
              </div>

              <button type="button" className="register-btn" onClick={() => setModalOpen(true)}>
                <span>
                  Registrar nueva
                  <br />
                  correspondencia
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
                  <th>Residente</th>
                  <th>Documento</th>
                  <th>Remitente</th>
                  <th>Torre</th>
                  <th>Apartamento</th>
                  <th>Observación</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="guard-module-empty-row">
                      No hay correspondencia registrada.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={`tipo-icon ${item.tipoEntrega === "Paquete" ? "car" : "moto"}`}>
                          <i
                            className={`ph-light ${
                              item.tipoEntrega === "Paquete" ? "ph-package" : "ph-file-text"
                            }`}
                          ></i>
                        </div>
                      </td>
                      <td>{item.residente}</td>
                      <td>{item.documento}</td>
                      <td>{item.remitente}</td>
                      <td>{item.torre}</td>
                      <td>{item.apartamento}</td>
                      <td>{item.observacion}</td>
                      <td>{item.fecha}</td>
                      <td>{item.hora}</td>
                      <td>
                        <div className="action-btns">
                          <button
                            type="button"
                            className="action-icon-btn delete"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item)}
                          >
                            {deletingId === item.id ? "..." : <i className="ph-light ph-trash"></i>}
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn"
                            onClick={() => {
                              setEditingItem(item);
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

      <CorrespondenciaModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        editingItem={editingItem}
        loading={loadingForm}
      />
    </InternalLayout>
  );
}
