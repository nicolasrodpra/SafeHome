import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import InternalLayout from "../../components/InternalLayout";
import { db } from "../FireBase/firebase";
import "../../styles/admin/adminComunicados.css";

function Comunicados() {
  const [comunicados, setComunicados] = useState([]);
  const [form, setForm] = useState({ asunto: "", mensaje: "" });
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [accionandoId, setAccionandoId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "comunicados"), orderBy("fecha", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data(),
        fechaStr: snapshotDoc.data().fecha?.toDate
          ? snapshotDoc.data().fecha.toDate().toLocaleString("es-CO", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
      }));

      setComunicados(data);
      setCargando(false);
    });

    return () => unsub();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  const handleCancelarEdicion = () => {
    if (loading) return;
    resetForm();
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
        await updateDoc(doc(db, "comunicados", editandoId), {
          asunto: form.asunto.trim(),
          mensaje: form.mensaje.trim(),
          actualizadoEn: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "comunicados"), {
          asunto: form.asunto.trim(),
          mensaje: form.mensaje.trim(),
          fecha: serverTimestamp(),
        });
      }

      resetForm();
    } catch (error) {
      console.error("Error al guardar comunicado:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo guardar el comunicado. Intenta de nuevo.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (comunicado) => {
    const result = await Swal.fire({
      title: "Eliminar comunicado?",
      text: "Esta accion no se puede deshacer.",
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
      await deleteDoc(doc(db, "comunicados", comunicado.id));

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
      console.error("Error al eliminar comunicado:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el comunicado. Intenta de nuevo.",
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
        <h1 className="page-title">Comunicados</h1>

        <div className="comunicados-layout">
          <div className="comunicados-list">
            {cargando ? (
              <p className="estado-msg">Cargando comunicados...</p>
            ) : comunicados.length === 0 ? (
              <p className="estado-msg">No hay comunicados publicados aun.</p>
            ) : (
              comunicados.map((comunicado) => (
                <div
                  className={`comunicado-card${
                    editandoId === comunicado.id ? " is-editing" : ""
                  }`}
                  key={comunicado.id}
                >
                  <div className="comunicado-header">
                    <h4>{comunicado.asunto}</h4>
                    <span className="comunicado-fecha">{comunicado.fechaStr}</span>
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
                  onClick={handleCancelarEdicion}
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

export default Comunicados;
