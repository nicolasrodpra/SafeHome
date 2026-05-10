import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import useSession from "../../hooks/useSession";
import InternalLayout from "../../layouts/InternalLayout";
import {
  createComunicado,
  deleteComunicado,
  getComunicados,
  updateComunicado,
} from "../../services/modules/comunicadosApi";
import "../../styles/admin/adminComunicados.css";

const INITIAL_FORM = {
  asunto: "",
  mensaje: "",
  imageData: "",
  imageName: "",
  imagePreview: "",
  removeImage: false,
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
    reader.readAsDataURL(file);
  });

function AdminComunicados() {
  const session = useSession();
  const [comunicados, setComunicados] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [accionandoId, setAccionandoId] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileInputRef = useRef(null);

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

  const resetFileInput = () => {
    setFileInputKey((current) => current + 1);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditandoId(null);
    resetFileInput();
  };

  const handleEditar = (comunicado) => {
    setEditandoId(comunicado.id);
    setForm({
      asunto: comunicado.asunto,
      mensaje: comunicado.mensaje,
      imageData: "",
      imageName: comunicado.imageName || "",
      imagePreview: comunicado.imageUrl || "",
      removeImage: false,
    });
    resetFileInput();
  };

  const handleImageSelected = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      Swal.fire({
        title: "Archivo no válido",
        text: "Selecciona una imagen en formato JPG, PNG, WEBP o GIF.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      resetFileInput();
      return;
    }

    try {
      const imageData = await readFileAsDataUrl(selectedFile);
      setForm((prev) => ({
        ...prev,
        imageData,
        imageName: selectedFile.name,
        imagePreview: imageData,
        removeImage: false,
      }));
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo cargar la imagen seleccionada.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
      resetFileInput();
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({
      ...prev,
      imageData: "",
      imageName: "",
      imagePreview: "",
      removeImage: true,
    }));
    resetFileInput();
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
      const payload = {
        asunto: form.asunto.trim(),
        mensaje: form.mensaje.trim(),
        removeImage: form.removeImage,
      };

      if (form.imageData) {
        payload.imageData = form.imageData;
        payload.imageName = form.imageName;
      }

      if (editandoId) {
        await updateComunicado(editandoId, payload);
      } else {
        await createComunicado({
          ...payload,
          senderRole: session?.rol || "Administrador",
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
          Publica avisos para la comunidad, ahora con imagen opcional para que la información se vea
          completa tanto en administración como en la vista del residente.
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

                  {comunicado.imageUrl ? (
                    <div className="comunicado-image-shell">
                      <img
                        src={comunicado.imageUrl}
                        alt={`Imagen del comunicado ${comunicado.asunto}`}
                        className="comunicado-image"
                      />
                    </div>
                  ) : null}

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
            {editandoId ? (
              <div className="form-editing-banner">
                <div>
                  <span className="editing-badge">Editando</span>
                  <p>Actualiza el contenido, la imagen o ambos antes de guardar.</p>
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
            ) : null}

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

            <div className="form-field">
              <label>Imagen opcional:</label>
              <input
                key={fileInputKey}
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageSelected}
              />
              <small className="comunicado-helper-copy">
                Formatos permitidos: JPG, PNG, WEBP o GIF. Máximo sugerido: 6 MB.
              </small>
            </div>

            {form.imagePreview ? (
              <div className="comunicado-preview-card">
                <div className="comunicado-preview-head">
                  <strong>{form.imageName || "Imagen seleccionada"}</strong>
                  <button
                    type="button"
                    className="btn-cancelar-edicion btn-inline-remove"
                    onClick={handleRemoveImage}
                    disabled={loading}
                  >
                    Quitar imagen
                  </button>
                </div>
                <img
                  src={form.imagePreview}
                  alt="Vista previa del comunicado"
                  className="comunicado-preview-image"
                />
              </div>
            ) : null}

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
