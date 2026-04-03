import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../config/firebase";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";
import "../../styles/residente/residenteComunicados.css";

export default function ResidenteComunicados() {
  const [comunicados, setComunicados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const comunicadosQuery = query(collection(db, "comunicados"), orderBy("fecha", "desc"));

    const unsubscribe = onSnapshot(
      comunicadosQuery,
      (snapshot) => {
        const nextComunicados = snapshot.docs.map((snapshotDoc) => {
          const data = snapshotDoc.data();
          const fechaDocumento = data.fecha?.toDate ? data.fecha.toDate() : null;

          return {
            id: snapshotDoc.id,
            asunto: data.asunto || "Sin asunto",
            mensaje: data.mensaje || "Sin mensaje",
            fecha: fechaDocumento
              ? fechaDocumento.toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "Fecha no disponible",
            hora: fechaDocumento
              ? fechaDocumento.toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Hora no disponible",
          };
        });

        setComunicados(nextComunicados);
        setCargando(false);
      },
      () => {
        setComunicados([]);
        setCargando(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <InternalLayoutResidente>
      <div className="content residente-comunicados-page">
        <header className="residente-comunicados-header">
          <div>
            <h1 className="internal-page-title">Comunicados</h1>
            <p className="residente-comunicados-copy">
              Consulta los avisos publicados por administracion con su asunto, mensaje, fecha y
              hora de publicacion.
            </p>
          </div>

          <div className="residente-comunicados-summary">
            <span>Total publicados</span>
            <strong>{comunicados.length}</strong>
          </div>
        </header>

        <section className="residente-comunicados-list">
          {cargando ? (
            <p className="residente-comunicados-empty">Cargando comunicados...</p>
          ) : comunicados.length === 0 ? (
            <p className="residente-comunicados-empty">No hay comunicados publicados aun.</p>
          ) : (
            comunicados.map((comunicado) => (
              <article className="residente-comunicado-card" key={comunicado.id}>
                <div className="residente-comunicado-head">
                  <h2>{comunicado.asunto}</h2>
                  <div className="residente-comunicado-meta">
                    <span>{comunicado.fecha}</span>
                    <span>{comunicado.hora}</span>
                  </div>
                </div>

                <p>{comunicado.mensaje}</p>
              </article>
            ))
          )}
        </section>
      </div>
    </InternalLayoutResidente>
  );
}
