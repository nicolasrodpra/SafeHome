import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../config/firebase";
import InternalLayout from "../../layouts/InternalLayout";
import { readApiResponse } from "../../utils/readApiResponse";
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
    <div className="guard-modal-overlay" onClick={onClose}>
      <div className="guard-modal-box" onClick={(e) => e.stopPropagation()}>
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Residente</label>
              <input
                name="residente"
                value={form.residente}
                onChange={handleChange}
                placeholder="Nombre completo"
              />
              {errors.residente && <span className="field-error">{errors.residente}</span>}
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
              <label>Tipo de entrega</label>
              <select name="tipoEntrega" value={form.tipoEntrega} onChange={handleChange}>
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
                onChange={handleChange}
                placeholder="Empresa o persona"
              />
              {errors.remitente && <span className="field-error">{errors.remitente}</span>}
            </div>
          </div>

          <div className="form-row form-row-single">
            <div className="form-group">
              <label>Observacion</label>
              <input
                name="observacion"
                value={form.observacion}
                onChange={handleChange}
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

  const totalPaquetes = items.filter((item) => item.tipoEntrega === "Paquete").length;
  const totalSobres = items.filter((item) => item.tipoEntrega === "Sobre").length;
  const totalDocumentos = items.filter((item) => item.tipoEntrega === "Documento").length;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "correspondencia"),
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

        setItems(data);
      },
      (error) => {
        console.error("Error cargando correspondencia:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    setLoadingForm(true);

    try {
      if (editingItem) {
        const res = await fetch(`http://localhost:5000/api/correspondencia/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await readApiResponse(res, "No se pudo actualizar la correspondencia.");

        setItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? { ...item, ...data.correspondencia } : item
          )
        );
      } else {
        const res = await fetch("http://localhost:5000/api/correspondencia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await readApiResponse(res, "No se pudo registrar la correspondencia.");

        setItems((prev) => [...prev, data.correspondencia]);
      }

      setEditingItem(null);
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

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Eliminar correspondencia?",
      text: `Se eliminara la entrega registrada para ${item.residente}.`,
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
      const res = await fetch(`http://localhost:5000/api/correspondencia/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("No se pudo eliminar.");

      setItems((prev) => prev.filter((currentItem) => currentItem.id !== item.id));

      Swal.fire({
        title: "Correspondencia eliminada",
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
    <InternalLayout>
      <main className="content guard-module-page">
        <header className="guard-module-page-header">
          <div>
            <h1 className="internal-page-title">Registro de correspondencia</h1>
            <p className="guard-module-page-copy">
              Lleva el control de paquetes, sobres y documentos con una vista mas limpia y
              operativa para vigilancia.
            </p>
          </div>

          <div className="guard-module-summary">
            <span>Total registros</span>
            <strong>{items.length}</strong>
          </div>
        </header>

        <section className="card guard-module-surface">
          <div className="card-header guard-module-card-header">
            <div className="guard-module-head-copy">
              <h2 className="card-title">Resumen operativo</h2>
              <p className="guard-module-card-copy">
                Organiza las entregas registradas y actualiza rapidamente cualquier novedad del
                modulo.
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

              <button type="button" className="register-btn" onClick={handleOpenCreate}>
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
                  <th>Observacion</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="guard-module-empty-row">
                      No hay correspondencia registrada
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div
                          className={`tipo-icon ${
                            item.tipoEntrega === "Paquete" ? "car" : "moto"
                          }`}
                        >
                          <i
                            className={`ph-light ${
                              item.tipoEntrega === "Paquete"
                                ? "ph-package"
                                : "ph-file-text"
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
                            onClick={() => handleOpenEdit(item)}
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
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
        loading={loadingForm}
      />
    </InternalLayout>
  );
}
