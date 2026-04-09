// Página de perfil compartida por todos los roles.
// Consulta el perfil real en backend, permite editar campos válidos
// y sincroniza los cambios con la sesión local.
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import useSession from "../../hooks/useSession";
import InternalLayout from "../../layouts/InternalLayout";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";
import {
  getUserProfile,
  updateUserProfile,
} from "../../services/modules/userApi";
import { updateSessionProfile } from "../../services/sessionService";
import "../../styles/general/perfilUsuario.css";

const roleDescriptions = {
  Administrador: "Gestiona la operación general del conjunto y supervisa los módulos internos.",
  Residente: "Consulta información del conjunto y mantiene sus datos residenciales asociados.",
  Vigilante: "Controla accesos, novedades y registros operativos del conjunto residencial.",
};

const getFieldValue = (value) => (value ? value : "No disponible");

const emptyForm = {
  nombres: "",
  apellidos: "",
  cedula: "",
  email: "",
  rol: "",
  torre: "",
  apartamento: "",
  zonaVigilancia: "",
  tipoSangre: "",
  tarifaHora: "",
  cantidadParqueaderos: "",
};

// Cuando la sesión solo trae el nombre completo, esta función lo separa
// en dos partes simples para llenar el formulario mientras llega el backend.
const getFallbackNameParts = (source = {}, session = null) => {
  if (source.nombres || source.apellidos) {
    return {
      nombres: source.nombres || "",
      apellidos: source.apellidos || "",
    };
  }

  if (session?.nombres || session?.apellidos) {
    return {
      nombres: session.nombres || "",
      apellidos: session.apellidos || "",
    };
  }

  const fullName = session?.nombre?.trim() || "";
  const parts = fullName.split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return {
      nombres: fullName,
      apellidos: "",
    };
  }

  const splitIndex = Math.ceil(parts.length / 2);

  return {
    nombres: parts.slice(0, splitIndex).join(" "),
    apellidos: parts.slice(splitIndex).join(" "),
  };
};

// Esta función arma un perfil seguro usando primero la respuesta del backend
// y, si algo falta, completa con lo que ya tenemos guardado en la sesión.
const buildProfileFromSource = (source = {}, session = null) => {
  const fallbackNameParts = getFallbackNameParts(source, session);
  const nombres = source.nombres || session?.nombres || fallbackNameParts.nombres;
  const apellidos = source.apellidos || session?.apellidos || fallbackNameParts.apellidos;
  const nombre =
    source.nombre ||
    [nombres, apellidos].filter(Boolean).join(" ").trim() ||
    session?.nombre ||
    "Usuario";

  return {
    nombre,
    nombres,
    apellidos,
    cedula: source.cedula || session?.cedula || "",
    email: source.email || session?.email || "",
    rol: source.rol || session?.rol || "Usuario",
    torre: source.torre || session?.torre || "",
    apartamento: source.apartamento || session?.apartamento || "",
    zonaVigilancia: source.zonaVigilancia || session?.zonaVigilancia || "",
    tipoSangre: source.tipoSangre || session?.tipoSangre || "",
    tarifaHora:
      typeof source.tarifaHora === "number"
        ? source.tarifaHora
        : typeof session?.tarifaHora === "number"
          ? session.tarifaHora
          : 0,
    cantidadParqueaderos:
      typeof source.cantidadParqueaderos === "number"
        ? source.cantidadParqueaderos
        : typeof session?.cantidadParqueaderos === "number"
          ? session.cantidadParqueaderos
          : 0,
  };
};

const buildFormFromProfile = (profile) => ({
  nombres: profile?.nombres || "",
  apellidos: profile?.apellidos || "",
  cedula: profile?.cedula || "",
  email: profile?.email || "",
  rol: profile?.rol || "",
  torre: profile?.torre || "",
  apartamento: profile?.apartamento || "",
  zonaVigilancia: profile?.zonaVigilancia || "",
  tipoSangre: profile?.tipoSangre || "",
  tarifaHora: profile?.tarifaHora ? String(profile.tarifaHora) : "",
  cantidadParqueaderos: profile?.cantidadParqueaderos ? String(profile.cantidadParqueaderos) : "",
});

export default function PerfilUsuarioPage() {
  const session = useSession();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const layoutRole = profile?.rol || session?.rol;
  const LayoutComponent = layoutRole === "Residente" ? InternalLayoutResidente : InternalLayout;

  // Esta función actualiza el perfil mostrado y el formulario al mismo tiempo
  // para que la vista y los inputs siempre queden sincronizados.
  const syncProfileState = (nextProfile) => {
    setProfile(nextProfile);
    setForm(buildFormFromProfile(nextProfile));
  };

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!session?.uid) {
        if (active) {
          setProfile(null);
          setForm(emptyForm);
          setLoading(false);
        }
        return;
      }

      const fallbackProfile = buildProfileFromSource({}, session);

      if (active) {
        syncProfileState(fallbackProfile);
        setLoading(false);
      }

      try {
        const nextProfile = await getUserProfile(session.uid);

        if (active) {
          syncProfileState(buildProfileFromSource(nextProfile, session));
        }
      } catch (error) {
        if (active) {
          syncProfileState(fallbackProfile);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [session]);

  const roleSpecificFields = useMemo(() => {
    if (!profile) return [];

    if (profile.rol === "Residente") {
      return [
        { label: "Torre", value: profile.torre },
        { label: "Apartamento", value: profile.apartamento },
      ];
    }

    if (profile.rol === "Vigilante") {
      return [
        { label: "Zona de vigilancia", value: profile.zonaVigilancia },
        { label: "Tipo de sangre", value: profile.tipoSangre },
        { label: "Tarifa por hora", value: profile.tarifaHora ? `$${profile.tarifaHora}` : "" },
        { label: "Cantidad de parqueaderos", value: profile.cantidadParqueaderos || "" },
      ];
    }

    return [
      { label: "Permisos", value: "Acceso administrativo completo" },
      { label: "Estado", value: "Activo" },
    ];
  }, [profile]);

  const handleCancel = () => {
    if (!profile) return;

    setForm(buildFormFromProfile(profile));
    setEditMode(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!session?.uid || !profile) return;

    setSaving(true);

    try {
      const nextProfile = await updateUserProfile(session.uid, {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        cedula: form.cedula.trim(),
        torre: form.torre.trim(),
        apartamento: form.apartamento.trim(),
        zonaVigilancia: form.zonaVigilancia.trim(),
        tipoSangre: form.tipoSangre.trim(),
        tarifaHora: form.tarifaHora.trim() ? Number(form.tarifaHora) : "",
        cantidadParqueaderos: form.cantidadParqueaderos.trim()
          ? Number(form.cantidadParqueaderos)
          : "",
      });

      const normalizedProfile = buildProfileFromSource(nextProfile, session);

      syncProfileState(normalizedProfile);
      updateSessionProfile(normalizedProfile);
      setEditMode(false);

      Swal.fire({
        title: "Perfil actualizado",
        text: "Los cambios se guardaron correctamente.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo actualizar el perfil.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSaving(false);
    }
  };

  const isResidente = profile?.rol === "Residente";
  const isVigilante = profile?.rol === "Vigilante";

  return (
    <LayoutComponent>
      <div className="content">
        <section className="profile-page">
          <header className="profile-page-header">
            <div>
              <h1 className="internal-page-title">Mi perfil</h1>
              <p className="profile-page-copy">
                Consulta tu información y habilita el modo de actualización cuando necesites hacer
                cambios.
              </p>
            </div>

            <aside className="profile-role-badge">
              <span>Rol actual</span>
              <strong>{loading ? "Cargando..." : getFieldValue(profile?.rol)}</strong>
            </aside>
          </header>

          <div className="profile-layout">
            <article className="profile-card">
              <div className="profile-card-head">
                <span className="profile-kicker">{editMode ? "Modo edición" : "Solo lectura"}</span>
                <h2>Información principal</h2>
                <p>
                  {editMode
                    ? "Actualiza tus datos personales antes de guardar."
                    : "Estos datos se muestran como referencia. Usa actualizar para habilitar la edición."}
                </p>
              </div>

              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="profile-grid">
                  <div className="profile-field profile-field-full">
                    <label>Nombre completo</label>
                    <div>{loading ? "Cargando..." : getFieldValue(profile?.nombre)}</div>
                  </div>

                  <div className="profile-field">
                    <label>Nombres</label>
                    <input
                      name="nombres"
                      value={form.nombres || ""}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, nombres: event.target.value }))
                      }
                      disabled={!editMode || loading}
                    />
                  </div>

                  <div className="profile-field">
                    <label>Apellidos</label>
                    <input
                      name="apellidos"
                      value={form.apellidos || ""}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, apellidos: event.target.value }))
                      }
                      disabled={!editMode || loading}
                    />
                  </div>

                  <div className="profile-field">
                    <label>Cédula</label>
                    <input
                      name="cedula"
                      value={form.cedula || ""}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, cedula: event.target.value }))
                      }
                      disabled={!editMode || loading}
                    />
                  </div>

                  <div className="profile-field">
                    <label>Correo</label>
                    <input name="email" value={form.email || ""} disabled />
                  </div>

                  <div className="profile-field">
                    <label>Rol</label>
                    <input name="rol" value={form.rol || ""} disabled />
                  </div>

                  {isResidente && (
                    <>
                      <div className="profile-field">
                        <label>Torre</label>
                        <input
                          name="torre"
                          value={form.torre || ""}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, torre: event.target.value }))
                          }
                          disabled={!editMode || loading}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Apartamento</label>
                        <input
                          name="apartamento"
                          value={form.apartamento || ""}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, apartamento: event.target.value }))
                          }
                          disabled={!editMode || loading}
                        />
                      </div>
                    </>
                  )}

                  {isVigilante && (
                    <>
                      <div className="profile-field">
                        <label>Zona de vigilancia</label>
                        <input
                          name="zonaVigilancia"
                          value={form.zonaVigilancia || ""}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, zonaVigilancia: event.target.value }))
                          }
                          disabled={!editMode || loading}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Tipo de sangre</label>
                        <input
                          name="tipoSangre"
                          value={form.tipoSangre || ""}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, tipoSangre: event.target.value }))
                          }
                          disabled={!editMode || loading}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Tarifa por hora</label>
                        <input
                          name="tarifaHora"
                          type="number"
                          min="1"
                          step="0.01"
                          value={form.tarifaHora || ""}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, tarifaHora: event.target.value }))
                          }
                          disabled={!editMode || loading}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Cantidad de parqueaderos</label>
                        <input
                          name="cantidadParqueaderos"
                          type="number"
                          min="1"
                          step="1"
                          value={form.cantidadParqueaderos || ""}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              cantidadParqueaderos: event.target.value,
                            }))
                          }
                          disabled={!editMode || loading}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="profile-actions">
                  {editMode ? (
                    <>
                      <button type="button" className="profile-secondary" onClick={handleCancel}>
                        Cancelar
                      </button>
                      <button type="submit" className="profile-primary" disabled={saving}>
                        {saving ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="profile-primary"
                      onClick={() => setEditMode(true)}
                    >
                      Actualizar
                    </button>
                  )}
                </div>
              </form>
            </article>

            <aside className="profile-side-card">
              <div className="profile-side-copy">
                <span className="profile-kicker">Resumen</span>
                <h2>Detalle del perfil</h2>
                <p>
                  {loading
                    ? "Cargando información del perfil..."
                    : roleDescriptions[profile?.rol] || "Consulta la información de tu cuenta."}
                </p>
              </div>

              <div className="profile-side-section">
                <h3>Datos del rol</h3>
                <div className="profile-side-list">
                  {roleSpecificFields.map((field) => (
                    <div key={field.label} className="profile-side-item">
                      <span>{field.label}</span>
                      <strong>{loading ? "Cargando..." : getFieldValue(field.value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </LayoutComponent>
  );
}
