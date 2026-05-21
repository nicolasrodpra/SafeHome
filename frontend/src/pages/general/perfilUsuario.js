// Página de perfil compartida por todos los roles.
// Carga el perfil real, arma un formulario seguro y respeta los campos bloqueados.
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import useSession from "../../hooks/useSession";
import InternalLayout from "../../layouts/InternalLayout";
import InternalLayoutResidente from "../../layouts/InternalLayoutResidente";
import { getUserProfile, updateUserProfile } from "../../services/modules/userApi";
import { getVigilanciaConfig } from "../../services/modules/vigilanciaApi";
import { updateSessionProfile } from "../../services/sessionService";
import "../../styles/general/perfilUsuario.css";

// Textos de apoyo para la tarjeta lateral.
const roleDescriptions = {
  Administrador: "Gestiona la operación general del conjunto y supervisa los módulos internos.",
  Residente: "Consulta información del conjunto y mantiene sus datos residenciales asociados.",
  Vigilante: "Controla accesos, novedades y registros operativos del conjunto residencial.",
};

const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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
});

const buildProfileUpdatePayload = (form) => ({
  nombres: form.nombres.trim(),
  apellidos: form.apellidos.trim(),
  cedula: form.cedula.trim(),
  torre: form.torre.trim(),
  apartamento: form.apartamento.trim(),
  zonaVigilancia: form.zonaVigilancia.trim(),
  tipoSangre: form.tipoSangre.trim(),
});

const getMissingRequiredFields = (form, role, vigilanciaTarifaHora) => {
  const fields = [
    { label: "nombres", value: form.nombres },
    { label: "apellidos", value: form.apellidos },
    { label: "cédula", value: form.cedula },
    { label: "correo", value: form.email },
    { label: "rol", value: form.rol },
  ];

  if (role === "Residente") {
    fields.push(
      { label: "torre", value: form.torre },
      { label: "apartamento", value: form.apartamento }
    );
  }

  if (role === "Vigilante") {
    fields.push(
      { label: "zona de vigilancia", value: form.zonaVigilancia },
      { label: "tipo de sangre", value: form.tipoSangre }
    );

    if (!(Number(vigilanciaTarifaHora) > 0)) {
      fields.push({ label: "tarifa de vigilancia en administración", value: "" });
    }
  }

  return fields.filter((field) => !String(field.value || "").trim()).map((field) => field.label);
};

const getRoleSpecificFields = (profile, vigilanciaTarifaHora = 0) => {
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
      {
        label: "Tarifa por hora",
        value: vigilanciaTarifaHora ? `$${vigilanciaTarifaHora}` : "",
      },
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
  const [vigilanciaConfig, setVigilanciaConfig] = useState(null);

  const layoutRole = profile?.rol || session?.rol;
  const LayoutComponent = layoutRole === "Residente" ? InternalLayoutResidente : InternalLayout;
  const isResidente = profile?.rol === "Residente";
  const isVigilante = profile?.rol === "Vigilante";
  const vigilanciaTarifaHora = Number(vigilanciaConfig?.tarifaHoraVigilante) || 0;
  const roleSpecificFields = getRoleSpecificFields(profile, vigilanciaTarifaHora);

  const syncProfileState = (nextProfile) => {
    setProfile(nextProfile);
    setForm(buildFormFromProfile(nextProfile));
  };

  const handleFieldChange = (fieldName) => (event) => {
    const nextValue = event.target.value;

    setForm((current) => ({ ...current, [fieldName]: nextValue }));
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

  useEffect(() => {
    let active = true;

    const loadVigilanciaConfig = async () => {
      if (!isVigilante) {
        if (active) {
          setVigilanciaConfig(null);
        }
        return;
      }

      try {
        const config = await getVigilanciaConfig();

        if (active) {
          setVigilanciaConfig(config);
          updateSessionProfile({
            tarifaHora: Number(config?.tarifaHoraVigilante) || 0,
          });
        }
      } catch (error) {
        if (active) {
          setVigilanciaConfig(null);
        }
      }
    };

    loadVigilanciaConfig();

    return () => {
      active = false;
    };
  }, [isVigilante]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!session?.uid || !profile) {
      return;
    }

    const missingFields = getMissingRequiredFields(form, profile.rol, vigilanciaTarifaHora);

    if (missingFields.length > 0) {
      Swal.fire({
        title: "Campos obligatorios pendientes",
        text: `Completa estos campos antes de guardar: ${missingFields.join(", ")}.`,
        icon: "warning",
        confirmButtonColor: "#460669",
      });
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
                    ? "Actualiza tus datos personales editables antes de guardar. Todos los campos deben estar completos para poder enviar los cambios."
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
                      required
                      disabled={!editMode || loading}
                    />
                  </div>

                  <div className="profile-field">
                    <label>Apellidos</label>
                    <input
                      name="apellidos"
                      value={form.apellidos || ""}
                      onChange={handleFieldChange("apellidos")}
                      required
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
                          required
                          disabled={!editMode || loading}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Tipo de sangre</label>
                        <select
                          name="tipoSangre"
                          value={form.tipoSangre || ""}
                          onChange={handleFieldChange("tipoSangre")}
                          required
                          disabled={!editMode || loading}
                        >
                          <option value="">Selecciona el tipo de sangre</option>
                          {bloodTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="profile-field">
                        <label>Tarifa por hora</label>
                        <input
                          name="tarifaHora"
                          type="text"
                          value={
                            vigilanciaTarifaHora > 0
                              ? `$${vigilanciaTarifaHora}`
                              : "Pendiente por definir en administraciÃ³n"
                          }
                          disabled
                          title="La tarifa del vigilante se configura desde administraciÃ³n."
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
