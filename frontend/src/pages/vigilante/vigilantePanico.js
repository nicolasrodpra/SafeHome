import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import InternalLayout from "../../layouts/InternalLayout";
import useSession from "../../hooks/useSession";
import {
  getAlertasPanico,
  markAlertaPanicoEnCamino,
  resolveAlertaPanico,
} from "../../services/modules/vigilanciaApi";
import "../../styles/vigilante/vigilanteMenu.css";

const ACTIVE_PANIC_STATUSES = ["Activa", "En camino"];

const formatResidentLocation = (alerta) => {
  const torre = alerta.torre ? `Torre ${alerta.torre}` : "";
  const apartamento = alerta.apartamento ? `Apto ${alerta.apartamento}` : "";
  const bloque = alerta.bloque ? `Bloque ${alerta.bloque}` : "";
  const piso = alerta.piso ? `Piso ${alerta.piso}` : "";
  return [torre, apartamento, bloque, piso].filter(Boolean).join(" · ") || "Ubicacion no registrada";
};

const getContactLine = (alerta) => {
  const phone = alerta.telefono || alerta.celular || alerta?.userSnapshot?.telefono || alerta?.userSnapshot?.celular;
  const email = alerta.residentEmail || alerta?.userSnapshot?.email;
  return [email, phone].filter(Boolean).join(" · ") || "Sin contacto";
};

const getResidentAudioSrc = (alerta) => {
  const audio = alerta?.residentAudio;
  if (!audio) {
    return "";
  }

  if (audio.url) {
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    const serverBase = apiBase.replace(/\/api\/?$/, "");
    return `${serverBase}${audio.url}`;
  }

  if (audio.audioBase64) {
    return `data:${audio.mimeType || "audio/m4a"};base64,${audio.audioBase64}`;
  }

  return "";
};

function AlertaPanicoCard({ alerta, onMarkOnWay, onResolve, workingAction }) {
  const isOnWay = alerta.status === "En camino";
  const audioSrc = getResidentAudioSrc(alerta);

  return (
    <article className={`vigilante-panico-card ${isOnWay ? "is-on-way" : ""}`}>
      <div className="vigilante-panico-card-head">
        <span className={`vigilante-panico-chip ${isOnWay ? "is-on-way" : ""}`}>
          {isOnWay ? "En camino" : "Emergencia"}
        </span>
        <span className="vigilante-panico-time">
          {alerta.createdDateLabel} · {alerta.createdTimeLabel}
        </span>
      </div>

      <h4>{alerta.residentName || "Residente"}</h4>
      <p>{formatResidentLocation(alerta)}</p>
      {alerta.cedula ? <p>Cedula: {alerta.cedula}</p> : null}
      <p>{getContactLine(alerta)}</p>
      {audioSrc ? (
        <div className="vigilante-panico-audio">
          <span>Audio del residente</span>
          <audio controls src={audioSrc}>
            Tu navegador no puede reproducir este audio.
          </audio>
        </div>
      ) : null}

      <div className="vigilante-panico-actions">
        {!isOnWay ? (
          <button
            type="button"
            className="vigilante-panico-onway-btn"
            onClick={() => onMarkOnWay(alerta)}
            disabled={Boolean(workingAction)}
          >
            {workingAction === "onway" ? "Actualizando..." : "En camino"}
          </button>
        ) : (
          <span className="vigilante-panico-note">Esperando confirmacion del residente</span>
        )}
        <button
          type="button"
          className="vigilante-panico-resolve-btn"
          onClick={() => onResolve(alerta)}
          disabled={Boolean(workingAction)}
        >
          {workingAction === "resolve" ? "Marcando..." : "Marcar atendida"}
        </button>
      </div>
    </article>
  );
}

export default function VigilantePanicoPage() {
  const session = useSession();
  const [historialPanico, setHistorialPanico] = useState([]);
  const [loadingPanico, setLoadingPanico] = useState(true);
  const [workingAlert, setWorkingAlert] = useState({ id: "", action: "" });

  const loadAlertasPanico = useCallback(async () => {
    try {
      const alertas = await getAlertasPanico();
      setHistorialPanico(alertas);
      setLoadingPanico(false);
    } catch (error) {
      setHistorialPanico([]);
      setLoadingPanico(false);
    }
  }, []);

  useEffect(() => {
    loadAlertasPanico();
    const intervalId = window.setInterval(loadAlertasPanico, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadAlertasPanico]);

  const handleMarkOnWay = async (alerta) => {
    if (!alerta?.id || workingAlert.id) {
      return;
    }

    setWorkingAlert({ id: alerta.id, action: "onway" });
    try {
      await markAlertaPanicoEnCamino(alerta.id, {
        responderId: session?.uid || session?.id || session?.userId || "",
        responderName: session?.nombre || "Vigilante",
      });

      await loadAlertasPanico();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: "Vigilancia en camino",
        showConfirmButton: false,
        timer: 2500,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: error.message || "Intenta de nuevo en unos segundos.",
      });
    } finally {
      setWorkingAlert({ id: "", action: "" });
    }
  };

  const handleResolveAlerta = async (alerta) => {
    if (!alerta?.id || workingAlert.id) {
      return;
    }

    setWorkingAlert({ id: alerta.id, action: "resolve" });
    try {
      await resolveAlertaPanico(alerta.id, {
        resolvedById: session?.uid || session?.id || session?.userId || "",
        resolvedByName: session?.nombre || "Vigilante",
      });

      await loadAlertasPanico();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Alerta marcada como atendida",
        showConfirmButton: false,
        timer: 2500,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: error.message || "Intenta de nuevo en unos segundos.",
      });
    } finally {
      setWorkingAlert({ id: "", action: "" });
    }
  };

  const activeAlertas = historialPanico.filter((item) =>
    ACTIVE_PANIC_STATUSES.includes(item.status)
  );

  return (
    <InternalLayout>
      <div className="content">
        <section className={`vigilante-panico-board ${activeAlertas.length > 0 ? "is-active" : ""}`}>
          <div className="vigilante-panico-head">
            <h3>
              <i className="ph-fill ph-warning-circle" aria-hidden="true"></i>
              Alertas de panico activas
            </h3>
            <span>{loadingPanico ? "Cargando..." : `${activeAlertas.length} activa(s)`}</span>
          </div>

          {loadingPanico ? (
            <p className="vigilante-panico-empty">Consultando alertas de emergencia...</p>
          ) : activeAlertas.length === 0 ? (
            <p className="vigilante-panico-empty">No hay alertas de panico activas en este momento.</p>
          ) : (
            <div className="vigilante-panico-grid">
              {activeAlertas.map((alerta) => (
                <AlertaPanicoCard
                  key={alerta.id}
                  alerta={alerta}
                  onMarkOnWay={handleMarkOnWay}
                  onResolve={handleResolveAlerta}
                  workingAction={workingAlert.id === alerta.id ? workingAlert.action : ""}
                />
              ))}
            </div>
          )}
        </section>

        <section className="vigilante-panico-history">
          <div className="vigilante-panico-history-head">
            <h3>Historial de activaciones del boton de panico</h3>
            <span>{historialPanico.length} registro(s)</span>
          </div>

          {historialPanico.length === 0 ? (
            <p className="vigilante-panico-empty">Aun no hay activaciones registradas.</p>
          ) : (
            <div className="vigilante-panico-table-wrap">
              <table className="vigilante-panico-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Residente</th>
                    <th>Ubicacion</th>
                    <th>Contacto</th>
                    <th>Activada</th>
                    <th>Atendida</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPanico.map((alerta) => (
                    <tr key={alerta.id}>
                      <td>
                        <span
                          className={`vigilante-panico-status ${
                            alerta.status === "Atendida"
                              ? "is-resolved"
                              : alerta.status === "En camino"
                                ? "is-on-way"
                                : "is-active"
                          }`}
                        >
                          {alerta.status}
                        </span>
                      </td>
                      <td>
                        <div className="vigilante-panico-user-cell">
                          <strong>{alerta.residentName || "Residente"}</strong>
                          <span>UID: {alerta.residentId || alerta?.userSnapshot?.uid || "No disponible"}</span>
                          <span>Rol: {alerta.rol || alerta?.userSnapshot?.rol || "Residente"}</span>
                          <span>Cedula: {alerta.cedula || "No registrada"}</span>
                        </div>
                      </td>
                      <td>{formatResidentLocation(alerta)}</td>
                      <td>{getContactLine(alerta)}</td>
                      <td>{`${alerta.createdDateLabel} · ${alerta.createdTimeLabel}`}</td>
                      <td>
                        {alerta.status === "Atendida"
                          ? `${alerta.resolvedDateLabel || "-"} · ${alerta.resolvedTimeLabel || "-"} ${
                              alerta.resolvedByName ? `(${alerta.resolvedByName})` : ""
                            }`
                          : "Pendiente"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </InternalLayout>
  );
}
