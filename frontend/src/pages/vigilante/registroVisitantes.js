import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../../config/firebase";
import InternalLayout from "../../layouts/InternalLayout";
import { readApiResponse } from "../../utils/readApiResponse";
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
    if (!form.residente.trim()) nextErrors.residente = "Requerido";
    if (!form.torre.trim()) nextErrors.torre = "Requerido";
    if (!form.apartamento.trim()) nextErrors.apartamento = "Requerido";
    if (!form.motivo.trim()) nextErrors.motivo = "Requerido";
    if (!form.telefono.trim()) nextErrors.telefono = "Requerido";

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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Visitante</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre completo"
              />
              {errors.nombre && <span className="field-error">{errors.nombre}</span>}
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
              <label>Residente que autoriza</label>
              <input
                name="residente"
                value={form.residente}
                onChange={handleChange}
                placeholder="Nombre del residente"
              />
              {errors.residente && <span className="field-error">{errors.residente}</span>}
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

          <div className="form-row form-row-single">
            <div className="form-group">
              <label>Motivo de visita</label>
              <input
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
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
  const totalVisitas = visitors.length;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "visitantes"),
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

        setVisitors(data);
      },
      (error) => {
        console.error("Error cargando visitantes:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleOpenCreate = () => {
    setEditingVisitor(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (visitor) => {
    setEditingVisitor(visitor);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    setLoadingForm(true);

    try {
      if (editingVisitor) {
        const res = await fetch(`http://localhost:5000/api/visitantes/${editingVisitor.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await readApiResponse(res, "No se pudo actualizar el visitante.");

        setVisitors((prev) =>
          prev.map((visitor) =>
            visitor.id === editingVisitor.id ? { ...visitor, ...data.visitante } : visitor
          )
        );
      } else {
        const res = await fetch("http://localhost:5000/api/visitantes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await readApiResponse(res, "No se pudo registrar el visitante.");

        setVisitors((prev) => [...prev, data.visitante]);
      }

      setEditingVisitor(null);
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

  const handleDelete = async (visitor) => {
    const result = await Swal.fire({
      title: "Eliminar visitante?",
      text: `Se eliminara el ingreso registrado para ${visitor.nombre}.`,
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
      const res = await fetch(`http://localhost:5000/api/visitantes/${visitor.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("No se pudo eliminar.");

      setVisitors((prev) => prev.filter((currentVisitor) => currentVisitor.id !== visitor.id));

      Swal.fire({
        title: "Visitante eliminado",
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
            <h1 className="internal-page-title">Registro de visitantes</h1>
            <p className="guard-module-page-copy">
              Gestiona los ingresos autorizados con una vista mas ordenada para registrar,
              editar y consultar visitantes del conjunto.
            </p>
          </div>

          <div className="guard-module-summary">
            <span>Total registros</span>
            <strong>{visitors.length}</strong>
          </div>
        </header>

        <section className="card guard-module-surface">
          <div className="card-header guard-module-card-header">
            <div className="guard-module-head-copy">
              <h2 className="card-title">Resumen operativo</h2>
              <p className="guard-module-card-copy">
                Mantiene trazabilidad de los ingresos del dia desde una interfaz mas limpia y
                facil de revisar.
              </p>
            </div>

            <div className="guard-module-header-tools">
              <div className="vehicle-counters">
                <div className="counter-card">
                  <div className="counter-icon car">
                    <i className="ph-light ph-users-three"></i>
                  </div>
                  <div className="counter-info">
                    <span className="counter-number">{totalVisitas}</span>
                    <span className="counter-label">Visitantes</span>
                  </div>
                </div>
              </div>

              <button type="button" className="register-btn" onClick={handleOpenCreate}>
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
                  <th>Telefono</th>
                  <th>Torre</th>
                  <th>Apartamento</th>
                  <th>Motivo</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {visitors.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="guard-module-empty-row">
                      No hay visitantes registrados
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
                            onClick={() => handleOpenEdit(visitor)}
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
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingVisitor={editingVisitor}
        loading={loadingForm}
      />
    </InternalLayout>
  );
}
