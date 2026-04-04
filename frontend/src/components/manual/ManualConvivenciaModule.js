import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import useSession from "../../hooks/useSession";
import {
  deleteManualConvivencia,
  getManualConvivencia,
  uploadManualConvivencia,
} from "../../services/modules/manualConvivenciaApi";
import "../../styles/shared/manualConvivencia.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Convertimos los bytes a un formato fácil de leer en la interfaz,
// por ejemplo KB o MB según el tamaño del archivo.
const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

// Antes de subir el archivo revisamos que exista, que sea PDF
// y que no supere el peso máximo permitido.
const validatePdf = (file) => {
  if (!file) {
    return "Selecciona un archivo PDF para continuar.";
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return "Solo se permiten archivos en formato PDF.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "El archivo supera el límite de 10 MB.";
  }

  return "";
};

// El backend recibe el PDF como texto base64, así que aquí
// convertimos el archivo local a ese formato.
const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado."));
    reader.readAsDataURL(file);
  });

export default function ManualConvivenciaModule({ mode = "resident" }) {
  const isAdminMode = mode === "admin";
  const session = useSession();
  const [manualData, setManualData] = useState(null);
  const [loadingManual, setLoadingManual] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Esta función trae el manual actual desde el backend.
  // Si no existe, dejamos el estado en `null`.
  const loadManual = async () => {
    try {
      const data = await getManualConvivencia();
      setManualData(data.manual || null);
    } catch (error) {
      setManualData(null);
    } finally {
      setLoadingManual(false);
    }
  };

  useEffect(() => {
    loadManual();
  }, []);

  const previewFile = selectedFile || manualData;

  // Cada vez que el usuario elige o arrastra un archivo
  // validamos primero para evitar errores más adelante.
  const handleSelectFile = (file) => {
    const errorMessage = validatePdf(file);

    if (errorMessage) {
      Swal.fire({
        title: "Archivo no válido",
        text: errorMessage,
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setSelectedFile(file);
  };

  // Sube el PDF al backend y luego actualiza la vista con el nuevo manual publicado.
  const handleUpload = async () => {
    const errorMessage = validatePdf(selectedFile);

    if (errorMessage) {
      Swal.fire({
        title: "Archivo no válido",
        text: errorMessage,
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setSubmitting(true);

    try {
      const fileData = await readFileAsDataUrl(selectedFile);
      const data = await uploadManualConvivencia({
        fileName: selectedFile.name,
        fileData,
        updatedBy: session?.nombre || "Administrador",
        updatedByEmail: session?.email || "",
      });

      setManualData(data.manual || null);
      setSelectedFile(null);

      Swal.fire({
        title: "Manual publicado",
        text: "El PDF del manual de convivencia ya está disponible.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo subir el PDF.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Elimina el manual actual después de una confirmación,
  // para evitar borrados accidentales.
  const handleDeleteManual = async () => {
    if (!manualData?.url) {
      return;
    }

    const result = await Swal.fire({
      title: "¿Eliminar manual?",
      text: "Los residentes dejarán de verlo hasta que subas uno nuevo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b42318",
      cancelButtonColor: "#460669",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setDeleting(true);

    try {
      await deleteManualConvivencia();
      setManualData(null);
      setSelectedFile(null);

      Swal.fire({
        title: "Manual eliminado",
        text: "El PDF se retiró correctamente del portal.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo eliminar el manual.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="manual-page">
      <header className="manual-page-header">
        <div>
          <h1 className="internal-page-title">Manual de convivencia</h1>
          <p className="manual-page-copy">
            {isAdminMode
              ? "Administra el documento oficial del conjunto y mantenlo disponible para toda la comunidad."
              : "Consulta el documento oficial compartido por administración desde una vista clara y centralizada."}
          </p>
        </div>
      </header>

      <div className={`manual-shell ${isAdminMode ? "is-admin" : "is-resident"}`}>
        <section className="manual-preview-panel">
          <div className="manual-panel-head">
            <div>
              <h2>Vista del documento</h2>
              <p>
                {manualData?.url
                  ? "Previsualización del PDF actualmente publicado."
                  : loadingManual
                  ? "Cargando manual..."
                  : ""}
              </p>
            </div>

            {manualData?.url ? (
              <a
                className="manual-open-link"
                href={manualData.url}
                target="_blank"
                rel="noreferrer"
              >
                Abrir PDF
              </a>
            ) : null}
          </div>

          <div className="manual-preview-stage">
            {manualData?.url ? (
              <iframe
                className="manual-preview-frame"
                title="Manual de convivencia"
                src={`${manualData.url}#toolbar=0&navpanes=0&scrollbar=0`}
              />
            ) : (
              <div className="manual-empty-preview">
                <div className="manual-empty-preview-icon">
                  <i className="ph-fill ph-book-bookmark"></i>
                </div>
                <strong>No hay manual publicado</strong>
                <p>
                  {isAdminMode
                    ? "Sube el PDF desde el panel derecho para que toda la comunidad pueda consultarlo."
                    : "La administración aún no ha publicado el manual de convivencia."}
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="manual-side-panel">
          <section className="manual-side-card">
            <div className="manual-panel-head">
              <div>
                <h2>{isAdminMode ? "Publicación" : "Información"}</h2>
                <p>
                  {isAdminMode
                    ? "Carga el archivo oficial del manual en formato PDF."
                    : "Detalles del archivo compartido por administración."}
                </p>
              </div>
            </div>

            <div className="manual-file-card">
              <div className="manual-file-icon">
                <i className="ph-fill ph-file-pdf"></i>
              </div>
              <div className="manual-file-copy">
                <strong>{previewFile?.fileName || "manual_convivencia.pdf"}</strong>
                <span>
                  {previewFile?.fileSize ? formatBytes(previewFile.fileSize) : "PDF oficial del conjunto"}
                </span>
              </div>
            </div>

            {manualData?.updatedBy ? (
              <div className="manual-meta-list">
                <div>
                  <span>Publicado por</span>
                  <strong>{manualData.updatedBy}</strong>
                </div>
                <div>
                  <span>Formato</span>
                  <strong>PDF</strong>
                </div>
              </div>
            ) : null}
          </section>

          {isAdminMode ? (
            <section className="manual-side-card">
              <div className="manual-panel-head">
                <div>
                  <h2>Subir archivo</h2>
                  <p>Arrastra el PDF o selecciona uno nuevo para reemplazar el actual.</p>
                </div>
              </div>

              <label
                className={`manual-upload-dropzone ${dragActive ? "is-dragging" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) {
                    handleSelectFile(file);
                  }
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleSelectFile(file);
                    }
                    event.target.value = "";
                  }}
                />
                <div className="manual-upload-icon">
                  <i className="ph-fill ph-upload-simple"></i>
                </div>
                <strong>Adjunta o arrastra el PDF aquí</strong>
                <span>Solo PDF, tamaño máximo de 10 MB.</span>
              </label>

              <div className="manual-selected-file">
                <div className="manual-selected-file-copy">
                  <strong>{selectedFile?.name || "Ningún archivo seleccionado"}</strong>
                  <span>{selectedFile ? formatBytes(selectedFile.size) : "Elige el manual oficial"}</span>
                </div>

                {selectedFile ? (
                  <button
                    type="button"
                    className="manual-remove-file"
                    onClick={() => setSelectedFile(null)}
                    disabled={submitting}
                  >
                    <i className="ph-light ph-trash"></i>
                  </button>
                ) : null}
              </div>

              <div className="manual-actions">
                {manualData?.url ? (
                  <button
                    type="button"
                    className="manual-icon-danger-button"
                    onClick={handleDeleteManual}
                    disabled={deleting || submitting}
                    aria-label="Eliminar manual actual"
                    title="Eliminar manual actual"
                  >
                    <i className="ph-light ph-trash"></i>
                  </button>
                ) : null}

                <button
                  type="button"
                  className="manual-secondary-button"
                  onClick={() => setSelectedFile(null)}
                  disabled={!selectedFile || submitting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="manual-primary-button"
                  onClick={handleUpload}
                  disabled={!selectedFile || submitting}
                >
                  {submitting ? "Subiendo..." : "Subir PDF"}
                </button>
              </div>
            </section>
          ) : (
            <section className="manual-side-card">
              <div className="manual-panel-head">
                <div>
                  <h2>Acciones</h2>
                  <p>Abre el PDF en una pestaña nueva para leerlo mejor o descargarlo.</p>
                </div>
              </div>

              <div className="manual-actions manual-actions-resident">
                <a
                  className={`manual-primary-button ${manualData?.url ? "" : "is-disabled-link"}`}
                  href={manualData?.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => {
                    if (!manualData?.url) {
                      event.preventDefault();
                    }
                  }}
                >
                  Abrir documento
                </a>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
