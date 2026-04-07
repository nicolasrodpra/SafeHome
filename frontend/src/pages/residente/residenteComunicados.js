// Vista de comunicados para residente.
// Solo consulta y muestra los avisos publicados por administracion.
import { useEffect, useState } from "react";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";
import { getComunicados } from "../../services/modules/comunicadosApi";
import "../../styles/residente/residenteComunicados.css";

export default function ResidenteComunicados() {
  const [comunicados, setComunicados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const loadComunicados = async () => {
      try {
        const nextComunicados = await getComunicados();
        setComunicados(nextComunicados);
      } catch (error) {
        setComunicados([]);
      } finally {
        setCargando(false);
      }
    };

    loadComunicados();
  }, []);

  return (
    <InternalLayoutResidente>
      <div className="content residente-comunicados-page">
        <header className="residente-comunicados-header">
          <div>
            <h1 className="internal-page-title">Comunicados</h1>
            <p className="residente-comunicados-copy">
              Consulta los avisos publicados por administración con su asunto, mensaje, fecha y
              hora de publicación.
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
            <p className="residente-comunicados-empty">No hay comunicados publicados aún.</p>
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
