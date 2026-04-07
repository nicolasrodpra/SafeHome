// Formulario administrativo de registro de usuarios.
// Desde aqui el administrador crea cuentas de administrador,
// residente o vigilante con campos dinamicos por rol.
import { useState } from "react";
import Swal from "sweetalert2";
import InternalLayout from "../../layouts/InternalLayout";
import { apiPost } from "../../services/apiClient";
import "../../styles/admin/registroAdmin.css";

const initialForm = {
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
  password: "",
  confirmPassword: "",
};

const roleOptions = ["Administrador", "Residente", "Vigilante"];
const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const roleDetails = {
  Administrador: {
    title: "Acceso administrativo",
    description: "Gestiona el panel completo y no requiere datos extra.",
    checklist: ["Control total del panel", "Solo necesita datos personales y acceso"],
  },
  Residente: {
    title: "Perfil de residente",
    description: "Relaciona al usuario con su ubicacion dentro del conjunto.",
    checklist: [
      "Registrar torre y apartamento",
      "Dejar listo el perfil para futuras actualizaciones",
    ],
  },
  Vigilante: {
    title: "Perfil de vigilancia",
    description:
      "Incluye datos operativos, el tipo de sangre y la tarifa por hora para vehiculos visitantes.",
    checklist: [
      "Registrar zona de vigilancia",
      "Guardar tipo de sangre",
      "Definir tarifa por hora",
    ],
  },
  default: {
    title: "Selecciona un rol",
    description: "Primero completa los datos base y luego elige el rol.",
    checklist: [
      "Todos requieren nombres, apellidos y cedula",
      "El formulario cambia segun el rol",
    ],
  },
};

function FormField({
  id,
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  children,
  inputMode,
  autoComplete,
  disabled = false,
  min,
  step,
}) {
  return (
    <div className="admin-register-field">
      <label htmlFor={id}>
        {label}
        {required && <span>*</span>}
      </label>

      {children || (
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          inputMode={inputMode}
          autoComplete={autoComplete}
          disabled={disabled}
          min={min}
          step={step}
        />
      )}
    </div>
  );
}

const sanitizeRoleClass = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

const getMissingFields = (currentForm) => {
  const fields = [
    { label: "nombres", value: currentForm.nombres },
    { label: "apellidos", value: currentForm.apellidos },
    { label: "cedula", value: currentForm.cedula },
    { label: "correo", value: currentForm.email },
    { label: "rol", value: currentForm.rol },
    { label: "contrasena", value: currentForm.password },
    { label: "confirmacion de contrasena", value: currentForm.confirmPassword },
  ];

  return fields.filter((field) => !field.value.trim()).map((field) => field.label);
};

const parseTarifaHora = (value) => {
  const parsedValue = Number(String(value).replace(",", "."));
  return Number.isFinite(parsedValue) ? parsedValue : NaN;
};

export default function RegistroAdminPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const selectedRoleDetails = roleDetails[form.rol] || roleDetails.default;
  const roleClassName = form.rol ? `is-${sanitizeRoleClass(form.rol)}` : "";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => {
      if (name !== "rol") {
        return {
          ...currentForm,
          [name]: value,
        };
      }

      return {
        ...currentForm,
        rol: value,
        torre: value === "Residente" ? currentForm.torre : "",
        apartamento: value === "Residente" ? currentForm.apartamento : "",
        zonaVigilancia: value === "Vigilante" ? currentForm.zonaVigilancia : "",
        tipoSangre: value === "Vigilante" ? currentForm.tipoSangre : "",
        tarifaHora: value === "Vigilante" ? currentForm.tarifaHora : "",
      };
    });
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const validateForm = (currentForm) => {
    const missingFields = getMissingFields(currentForm);

    if (missingFields.length > 0) {
      return `Completa estos campos: ${missingFields.join(", ")}.`;
    }

    if (
      currentForm.rol === "Residente" &&
      (!currentForm.torre.trim() || !currentForm.apartamento.trim())
    ) {
      return "Para un residente debes registrar torre y apartamento.";
    }

    if (
      currentForm.rol === "Vigilante" &&
      (!currentForm.zonaVigilancia.trim() ||
        !currentForm.tipoSangre.trim() ||
        !currentForm.tarifaHora.trim())
    ) {
      return "Para un vigilante debes registrar zona de vigilancia, tipo de sangre y tarifa por hora.";
    }

    if (currentForm.rol === "Vigilante") {
      const tarifaHora = parseTarifaHora(currentForm.tarifaHora);

      if (Number.isNaN(tarifaHora) || tarifaHora <= 0) {
        return "La tarifa por hora del vigilante debe ser mayor a 0.";
      }
    }

    if (currentForm.password !== currentForm.confirmPassword) {
      return "Las contrasenas no coinciden.";
    }

    if (currentForm.password.length < 6) {
      return "La contrasena debe tener al menos 6 caracteres.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateForm(form);

    if (validationMessage) {
      Swal.fire({
        title: "Formulario incompleto",
        text: validationMessage,
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    const payload = {
      nombre: `${form.nombres.trim()} ${form.apellidos.trim()}`.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      cedula: form.cedula.trim(),
      email: form.email.trim(),
      rol: form.rol,
      password: form.password,
      confirmPassword: form.confirmPassword,
      torre: form.rol === "Residente" ? form.torre.trim() : "",
      apartamento: form.rol === "Residente" ? form.apartamento.trim() : "",
      zonaVigilancia: form.rol === "Vigilante" ? form.zonaVigilancia.trim() : "",
      tipoSangre: form.rol === "Vigilante" ? form.tipoSangre.trim() : "",
      tarifaHora: form.rol === "Vigilante" ? parseTarifaHora(form.tarifaHora) : "",
    };

    setLoading(true);

    try {
      const data = await apiPost("/users", payload, "No se pudo registrar el usuario.");

      Swal.fire({
        title: "Usuario registrado",
        text: data.mensaje,
        icon: "success",
        confirmButtonColor: "#460669",
      });

      resetForm();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo registrar el usuario.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <InternalLayout>
      <div className="content admin-register-page">
        <div className="admin-register-header">
          <div>
            <h1 className="internal-page-title">Registrar usuario</h1>
            <p className="admin-register-copy">
              Crea un nuevo acceso y completa solo los datos que necesita cada rol.
            </p>
          </div>

          <div className={`admin-register-role-badge ${roleClassName}`}>
            <span>Rol seleccionado</span>
            <strong>{form.rol || "Pendiente"}</strong>
          </div>
        </div>

        <div className="admin-register-layout">
          <section className="admin-register-form-card">
            <div className="admin-register-card-head">
              <span className="admin-register-kicker">Nuevo acceso</span>
              <h2>Informacion del usuario</h2>
              <p>Completa los datos base y agrega los campos que cambian segun el rol.</p>
            </div>

            <form className="admin-register-form" onSubmit={handleSubmit}>
              <div className="admin-register-group">
                <div className="admin-register-group-head">
                  <h3>Datos personales</h3>
                  <p>Datos obligatorios para cualquier tipo de usuario.</p>
                </div>

                <div className="admin-register-grid">
                  <FormField
                    id="nombres"
                    name="nombres"
                    label="Nombres"
                    value={form.nombres}
                    onChange={handleChange}
                    placeholder="Escribe los nombres"
                    required
                    autoComplete="given-name"
                    disabled={loading}
                  />

                  <FormField
                    id="apellidos"
                    name="apellidos"
                    label="Apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                    placeholder="Escribe los apellidos"
                    required
                    autoComplete="family-name"
                    disabled={loading}
                  />

                  <FormField
                    id="cedula"
                    name="cedula"
                    label="Cedula"
                    value={form.cedula}
                    onChange={handleChange}
                    placeholder="Numero de cedula"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    disabled={loading}
                  />

                  <FormField
                    id="email"
                    type="email"
                    name="email"
                    label="Correo"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="correo@safehome.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="admin-register-group">
                <div className="admin-register-group-head">
                  <h3>Rol y configuracion</h3>
                  <p>El formulario mostrara aqui los campos especiales.</p>
                </div>

                <div className="admin-register-grid">
                  <FormField
                    id="rol"
                    name="rol"
                    label="Rol"
                    value={form.rol}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <div className="admin-register-select-wrap">
                      <select
                        id="rol"
                        name="rol"
                        value={form.rol}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Selecciona un rol</option>
                        {roleOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <i className="ph-light ph-caret-down"></i>
                    </div>
                  </FormField>

                  {form.rol === "Residente" && (
                    <>
                      <FormField
                        id="torre"
                        name="torre"
                        label="Torre"
                        value={form.torre}
                        onChange={handleChange}
                        placeholder="Ej. 01"
                        required
                        disabled={loading}
                      />

                      <FormField
                        id="apartamento"
                        name="apartamento"
                        label="Apartamento"
                        value={form.apartamento}
                        onChange={handleChange}
                        placeholder="Ej. 101"
                        required
                        disabled={loading}
                      />
                    </>
                  )}

                  {form.rol === "Vigilante" && (
                    <>
                      <FormField
                        id="zonaVigilancia"
                        name="zonaVigilancia"
                        label="Zona de vigilancia"
                        value={form.zonaVigilancia}
                        onChange={handleChange}
                        placeholder="Ej. Porteria principal"
                        required
                        disabled={loading}
                      />

                      <FormField
                        id="tipoSangre"
                        name="tipoSangre"
                        label="Tipo de sangre"
                        value={form.tipoSangre}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <div className="admin-register-select-wrap">
                          <select
                            id="tipoSangre"
                            name="tipoSangre"
                            value={form.tipoSangre}
                            onChange={handleChange}
                            required
                            disabled={loading}
                          >
                            <option value="">Selecciona el tipo de sangre</option>
                            {bloodTypeOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <i className="ph-light ph-caret-down"></i>
                        </div>
                      </FormField>

                      <FormField
                        id="tarifaHora"
                        type="number"
                        name="tarifaHora"
                        label="Tarifa por hora"
                        value={form.tarifaHora}
                        onChange={handleChange}
                        placeholder="Ej. 5000"
                        required
                        min="1"
                        step="0.01"
                        inputMode="decimal"
                        disabled={loading}
                      />
                    </>
                  )}

                  {form.rol === "Administrador" && (
                    <div className="admin-register-empty-state">
                      <strong>Sin campos extra para este rol</strong>
                      <p>
                        El perfil administrativo solo necesita datos personales, correo y
                        credenciales de acceso.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-register-group">
                <div className="admin-register-group-head">
                  <h3>Credenciales</h3>
                  <p>Define la contrasena inicial del usuario.</p>
                </div>

                <div className="admin-register-grid">
                  <FormField
                    id="password"
                    type="password"
                    name="password"
                    label="Contrasena"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimo 6 caracteres"
                    required
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <FormField
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    label="Confirmar contrasena"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite la contrasena"
                    required
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="admin-register-actions">
                <button
                  type="button"
                  className="admin-register-secondary"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Limpiar formulario
                </button>

                <button type="submit" className="admin-register-primary" disabled={loading}>
                  {loading ? "Registrando..." : "Registrar usuario"}
                </button>
              </div>
            </form>
          </section>

          <aside className="admin-register-side-card">
            <div className="admin-register-side-copy">
              <span className="admin-register-kicker">Resumen del rol</span>
              <h2>{selectedRoleDetails.title}</h2>
              <p>{selectedRoleDetails.description}</p>
            </div>

            <div className="admin-register-checklist">
              {selectedRoleDetails.checklist.map((item) => (
                <div className="admin-register-check-item" key={item}>
                  <span className="admin-register-check-dot"></span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </InternalLayout>
  );
}
