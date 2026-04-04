import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import InternalLayout from "../../layouts/InternalLayout";
import {
  createComunicado,
  deleteComunicado,
  getComunicados,
  updateComunicado,
} from "../../services/modules/comunicadosApi";
import "../../styles/admin/adminComunicados.css";

function AdminComunicados() {
  const [comunicados, setComunicados] = useState([]);
  const [form, setForm] = useState({ asunto: "", mensaje: "" });
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [accionandoId, setAccionandoId] = useState(null);

  const loadComunicados = async () => {
    try {
      const data = await getComunicados();
      setComunicados(data);
    } catch (error) {
      setComunicados([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadComunicados();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ asunto: "", mensaje: "" });
    setEditandoId(null);
  };

  const handleEditar = (comunicado) => {
    setEditandoId(comunicado.id);
    setForm({
      asunto: comunicado.asunto,
      mensaje: comunicado.mensaje,
    });
  };

  const handleEnviar = async () => {
    if (!form.asunto.trim() || !form.mensaje.trim()) {
      Swal.fire({
        title: "Campos incompletos",
        text: "Escribe el asunto y el comunicado antes de continuar.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setLoading(true);

    try {
      if (editandoId) {
        await updateComunicado(editandoId, {
          asunto: form.asunto.trim(),
          mensaje: form.mensaje.trim(),
        });
      } else {
        await createComunicado({
          asunto: form.asunto.trim(),
          mensaje: form.mensaje.trim(),
        });
      }

      await loadComunicados();
      resetForm();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo guardar el comunicado.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (comunicado) => {
    const result = await Swal.fire({
      title: "¿Eliminar comunicado?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b42318",
      cancelButtonColor: "#460669",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setAccionandoId(comunicado.id);

    try {
      await deleteComunicado(comunicado.id);
      await loadComunicados();

      if (editandoId === comunicado.id) {
        resetForm();
      }

      Swal.fire({
        title: "Comunicado eliminado",
        text: "El comunicado fue eliminado correctamente.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo eliminar el comunicado.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setAccionandoId(null);
    }
  };

  return (
    <InternalLayout>
      <div className="content">
        <h1 className="internal-page-title page-title">Comunicados</h1>
        <p className="page-copy">
          Publica avisos para la comunidad desde una vista más sobria, con lectura clara y
          acciones directas para editar o eliminar.
        </p>

        <div className="comunicados-layout">
          <div className="comunicados-list">
            {cargando ? (
              <p className="estado-msg">Cargando comunicados...</p>
            ) : comunicados.length === 0 ? (
              <p className="estado-msg">No hay comunicados publicados aún.</p>
            ) : (
              comunicados.map((comunicado) => (
                <div
                  className={`comunicado-card${editandoId === comunicado.id ? " is-editing" : ""}`}
                  key={comunicado.id}
                >
                  <div className="comunicado-header">
                    <h4>{comunicado.asunto}</h4>
                    <span className="comunicado-fecha">
                      {comunicado.fecha} {comunicado.hora}
                    </span>
                  </div>
                  <p>{comunicado.mensaje}</p>

                  <div className="comunicado-actions">
                    <button
                      type="button"
                      className="comunicado-action"
                      onClick={() => handleEditar(comunicado)}
                      disabled={loading || accionandoId === comunicado.id}
                      aria-label={`Editar comunicado ${comunicado.asunto}`}
                      title="Editar comunicado"
                    >
                      <i className="ph-light ph-pencil-simple"></i>
                    </button>

                    <button
                      type="button"
                      className="comunicado-action danger"
                      onClick={() => handleEliminar(comunicado)}
                      disabled={loading || accionandoId === comunicado.id}
                      aria-label={`Eliminar comunicado ${comunicado.asunto}`}
                      title="Eliminar comunicado"
                    >
                      <i className="ph-light ph-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="comunicados-form">
            {editandoId && (
              <div className="form-editing-banner">
                <div>
                  <span className="editing-badge">Editando</span>
                  <p>Actualiza el contenido y guarda los cambios del comunicado.</p>
                </div>

                <button
                  type="button"
                  className="btn-cancelar-edicion"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="form-field">
              <label>Asunto:</label>
              <input
                type="text"
                name="asunto"
                value={form.asunto}
                onChange={handleChange}
                placeholder="Escribe el asunto..."
              />
            </div>

            <div className="form-field">
              <label>Comunicado:</label>
              <textarea
                name="mensaje"
                value={form.mensaje}
                onChange={handleChange}
                placeholder="Escribe el comunicado..."
              />
            </div>

            <button className="btn-enviar" onClick={handleEnviar} disabled={loading}>
              {loading
                ? editandoId
                  ? "Guardando..."
                  : "Enviando..."
                : editandoId
                ? "Guardar cambios"
                : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </InternalLayout>
  );
}

export default AdminComunicados;
