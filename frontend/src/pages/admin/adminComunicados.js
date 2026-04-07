// Pantalla administrativa para publicar, editar y eliminar comunicados.
// Todo el CRUD se consume desde el modulo de comunicados del frontend.
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
  // Lista de comunicados traídos de la base de datos
  const [comunicados, setComunicados] = useState([]);
  // Datos del formulario (asunto y mensaje)
  const [form, setForm] = useState({ asunto: "", mensaje: "" });
  // Indica si se está enviando o guardando un comunicado
  const [loading, setLoading] = useState(false);
  // Indica si se están cargando los comunicados desde el servidor
  const [cargando, setCargando] = useState(true);
  // ID del comunicado siendo editado (null si no se edita)
  const [editandoId, setEditandoId] = useState(null);
  // ID del comunicado en proceso de eliminación
  const [accionandoId, setAccionandoId] = useState(null);

  // Trae la lista de comunicados desde el servidor
  const loadComunicados = async () => {
    try {
      const data = await getComunicados();
      setComunicados(data);
    } catch (error) {
      // Si hay error, muestra lista vacía
      setComunicados([]);
    } finally {
      // Detiene el estado de carga
      setCargando(false);
    }
  };

  // Carga los comunicados cuando el componente se monta
  useEffect(() => {
    loadComunicados();
  }, []);

  // Actualiza los campos del formulario cuando el usuario escribe
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Limpia el formulario y cancela la edición
  const resetForm = () => {
    setForm({ asunto: "", mensaje: "" });
    setEditandoId(null);
  };

  // Carga los datos del comunicado seleccionado en el formulario para editar
  const handleEditar = (comunicado) => {
    setEditandoId(comunicado.id);
    setForm({
      asunto: comunicado.asunto,
      mensaje: comunicado.mensaje,
    });
  };

  // Valida y envía o actualiza un comunicado
  const handleEnviar = async () => {
    // Validar que los campos no estén vacíos
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
      // Si se está editando, actualiza; si no, crea uno nuevo
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

      // Recarga la lista y limpia el formulario
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


  const handleEliminar = async (comunicado) => { //handleEliminar recibe el comunicado a eliminar para saber qué ID eliminar del servidor.
    // Muestra diálogo de confirmación
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

    // Cancela si el usuario no confirma
    if (!result.isConfirmed) return;

    setAccionandoId(comunicado.id); // Establece el ID del comunicado que se está eliminando para deshabilitar su botón y mostrar estado de acción.

    try {
      // Elimina el comunicado del servidor
      await deleteComunicado(comunicado.id);
      await loadComunicados();

      // Si se estaba editando este comunicado, limpia el formulario
      if (editandoId === comunicado.id) { // Si el comunicado que se eliminó es el que se estaba editando, resetea el formulario para evitar mostrar datos de un comunicado que ya no existe.
        resetForm();
      }

      // Muestra mensaje de éxito
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
      setAccionandoId(null); // Limpia el ID del comunicado en acción para reactivar los botones de edición y eliminación.
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
              // Renderiza cada comunicado como una tarjeta
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
