// Página de perfil compartida por todos los roles.
// Carga el perfil real, arma un formulario seguro y respeta los campos bloqueados.
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import useSession from "../../hooks/useSession";
import InternalLayout from "../../layouts/InternalLayout";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";
import { getUserProfile, updateUserProfile } from "../../services/modules/userApi";
import { updateSessionProfile } from "../../services/sessionService";
import "../../styles/general/perfilUsuario.css";

// Textos de apoyo para la tarjeta lateral.
const roleDescriptions = {
  Administrador: "Gestiona la operación general del conjunto y supervisa los módulos internos.",
  Residente: "Consulta información del conjunto y mantiene sus datos residenciales asociados.",
  Vigilante: "Controla accesos, novedades y registros operativos del conjunto residencial.",
};

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

const getFieldValue = (value) => (value ? value : "No disponible");

// Helpers para hidratar el perfil aunque la sesión llegue incompleta.
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

const buildProfileUpdatePayload = (form) => ({
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

const getRoleSpecificFields = (profile) => {
  if (!profile) {
    return [];
  }

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
};

export default function PerfilUsuarioPage() {
  const session = useSession();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const layoutRole = profile?.rol || session?.rol;
  const LayoutComponent = layoutRole === "Residente" ? InternalLayoutResidente : InternalLayout;
  const roleSpecificFields = getRoleSpecificFields(profile);
  const isResidente = profile?.rol === "Residente";
  const isVigilante = profile?.rol === "Vigilante";

  const syncProfileState = (nextProfile) => {
    setProfile(nextProfile);
    setForm(buildFormFromProfile(nextProfile));
  };

  const handleFieldChange = (fieldName) => (event) => {
    setForm((current) => ({ ...current, [fieldName]: event.target.value }));
  };

  const handleCancel = () => {
    if (!profile) {
      return;
    }

    setForm(buildFormFromProfile(profile));
    setEditMode(false);
  };

  // Carga el perfil desde backend y usa la sesión como respaldo inmediato.
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!session?.uid || !profile) {
      return;
    }

    setSaving(true);

    try {
      const nextProfile = await updateUserProfile(
        session.uid,
        buildProfileUpdatePayload(form)
      );
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
                    ? "Actualiza tus datos personales editables antes de guardar. La cedula, la torre y el apartamento permanecen bloqueados."
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
                      onChange={handleFieldChange("nombres")}
                      disabled={!editMode || loading}
                    />
                  </div>

                  <div className="profile-field">
                    <label>Apellidos</label>
                    <input
                      name="apellidos"
                      value={form.apellidos || ""}
                      onChange={handleFieldChange("apellidos")}
                      disabled={!editMode || loading}
                    />
                  </div>

                  <div className="profile-field">
                    <label>Cédula</label>
                    <input
                      name="cedula"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={form.cedula || ""}
                      disabled
                      title="La cedula no se puede editar."
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

                  {isResidente ? (
                    <>
                      <div className="profile-field">
                        <label>Torre</label>
                        <input
                          name="torre"
                          value={form.torre || ""}
                          disabled
                          title="La torre no se puede editar."
                        />
                      </div>
                      <div className="profile-field">
                        <label>Apartamento</label>
                        <input
                          name="apartamento"
                          value={form.apartamento || ""}
                          disabled
                          title="El apartamento no se puede editar."
                        />
                      </div>
                    </>
                  ) : null}

                  {isVigilante ? (
                    <>
                      <div className="profile-field">
                        <label>Zona de vigilancia</label>
                        <input
                          name="zonaVigilancia"
                          value={form.zonaVigilancia || ""}
                          onChange={handleFieldChange("zonaVigilancia")}
                          disabled={!editMode || loading}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Tipo de sangre</label>
                        <input
                          name="tipoSangre"
                          value={form.tipoSangre || ""}
                          onChange={handleFieldChange("tipoSangre")}
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
                          onChange={handleFieldChange("tarifaHora")}
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
                          onChange={handleFieldChange("cantidadParqueaderos")}
                          disabled={!editMode || loading}
                        />
                      </div>
                    </>
                  ) : null}
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
