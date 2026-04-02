import { useEffect, useMemo, useState } from "react";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Swal from "sweetalert2";
import InternalLayout from "../../layouts/InternalLayout";
import { auth, db } from "../../config/firebase";
import "../../styles/general/perfilUsuario.css";

const roleDescriptions = {
  Administrador: "Gestiona la operacion general del conjunto y supervisa los modulos internos.",
  Residente: "Consulta informacion del conjunto y mantiene sus datos residenciales asociados.",
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
};

export default function PerfilUsuarioPage() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user) {
        if (isMounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const data = snapshot.exists() ? snapshot.data() : {};
        const nextProfile = {
          nombre:
            data.nombre ||
            [data.nombres, data.apellidos].filter(Boolean).join(" ").trim() ||
            user.displayName ||
            "Usuario",
          nombres: data.nombres || "",
          apellidos: data.apellidos || "",
          cedula: data.cedula || "",
          email: data.email || user.email || "",
          rol: data.rol || "Usuario",
          torre: data.torre || "",
          apartamento: data.apartamento || "",
          zonaVigilancia: data.zonaVigilancia || "",
          tipoSangre: data.tipoSangre || "",
        };

        if (isMounted) {
          setProfile(nextProfile);
          setForm({
            nombres: nextProfile.nombres,
            apellidos: nextProfile.apellidos,
            cedula: nextProfile.cedula,
            email: nextProfile.email,
            rol: nextProfile.rol,
            torre: nextProfile.torre,
            apartamento: nextProfile.apartamento,
            zonaVigilancia: nextProfile.zonaVigilancia,
            tipoSangre: nextProfile.tipoSangre,
          });
          setLoading(false);
        }
      } catch (error) {
        const fallbackProfile = {
          nombre: user.displayName || user.email?.split("@")[0] || "Usuario",
          nombres: "",
          apellidos: "",
          cedula: "",
          email: user.email || "",
          rol: "Usuario",
          torre: "",
          apartamento: "",
          zonaVigilancia: "",
          tipoSangre: "",
        };

        if (isMounted) {
          setProfile(fallbackProfile);
          setForm({
            ...emptyForm,
            email: fallbackProfile.email,
            rol: fallbackProfile.rol,
          });
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
      ];
    }

    return [
      { label: "Permisos", value: "Acceso administrativo completo" },
      { label: "Estado", value: "Activo" },
    ];
  }, [profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleEnableEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    if (!profile) return;

    setForm({
      nombres: profile.nombres,
      apellidos: profile.apellidos,
      cedula: profile.cedula,
      email: profile.email,
      rol: profile.rol,
      torre: profile.torre,
      apartamento: profile.apartamento,
      zonaVigilancia: profile.zonaVigilancia,
      tipoSangre: profile.tipoSangre,
    });
    setEditMode(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user || !profile) return;

    setSaving(true);

    try {
      const nombreCompleto = `${form.nombres.trim()} ${form.apellidos.trim()}`.trim();
      const payload = {
        nombre: nombreCompleto || profile.nombre,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        cedula: form.cedula.trim(),
        email: form.email.trim(),
        rol: profile.rol,
        torre: form.torre.trim(),
        apartamento: form.apartamento.trim(),
        zonaVigilancia: form.zonaVigilancia.trim(),
        tipoSangre: form.tipoSangre.trim(),
      };

      await updateDoc(doc(db, "users", user.uid), payload);
      await updateProfile(user, {
        displayName: payload.nombre,
      });

      localStorage.setItem("safehome_profile_name", payload.nombre);
      localStorage.setItem("safehome_profile_role", profile.rol || "");

      const nextProfile = {
        ...profile,
        ...payload,
      };

      setProfile(nextProfile);
      setForm({
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        cedula: payload.cedula,
        email: payload.email,
        rol: payload.rol,
        torre: payload.torre,
        apartamento: payload.apartamento,
        zonaVigilancia: payload.zonaVigilancia,
        tipoSangre: payload.tipoSangre,
      });
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
    <InternalLayout>
      <div className="content">
        <section className="profile-page">
          <header className="profile-page-header">
            <div>
              <h1 className="internal-page-title">Mi perfil</h1>
              <p className="profile-page-copy">
                Consulta tu informacion y habilita el modo de actualizacion cuando necesites hacer cambios.
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
                <span className="profile-kicker">{editMode ? "Modo edicion" : "Solo lectura"}</span>
                <h2>Informacion principal</h2>
                <p>
                  {editMode
                    ? "Actualiza tu foto y tus datos personales antes de guardar."
                    : "Estos datos se muestran como referencia. Usa actualizar para habilitar la edicion."}
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
                      value={form.nombres}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                    />
                  </div>

                  <div className="profile-field">
                    <label>Apellidos</label>
                    <input
                      name="apellidos"
                      value={form.apellidos}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                    />
                  </div>

                  <div className="profile-field">
                    <label>Cedula</label>
                    <input
                      name="cedula"
                      value={form.cedula}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                    />
                  </div>

                  <div className="profile-field">
                    <label>Correo</label>
                    <input name="email" value={form.email} disabled />
                  </div>

                  <div className="profile-field">
                    <label>Rol</label>
                    <input name="rol" value={form.rol} disabled />
                  </div>

                  {isResidente && (
                    <>
                      <div className="profile-field">
                        <label>Torre</label>
                        <input
                          name="torre"
                          value={form.torre}
                          onChange={handleChange}
                          disabled={!editMode || loading}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Apartamento</label>
                        <input
                          name="apartamento"
                          value={form.apartamento}
                          onChange={handleChange}
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
                          value={form.zonaVigilancia}
                          onChange={handleChange}
                          disabled={!editMode || loading}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Tipo de sangre</label>
                        <input
                          name="tipoSangre"
                          value={form.tipoSangre}
                          onChange={handleChange}
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
                    <button type="button" className="profile-primary" onClick={handleEnableEdit}>
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
                    ? "Cargando informacion del perfil..."
                    : roleDescriptions[profile?.rol] || "Consulta la informacion de tu cuenta."}
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
    </InternalLayout>
  );
}
