// Formulario administrativo para crear nuevos usuarios.
// Agrupa validación, preparación del payload y reglas por rol.
import { useState } from "react";
import Swal from "sweetalert2";
import InternalLayout from "../../layouts/InternalLayout";
import { apiPost } from "../../services/apiClient";
import { getResidents } from "../../services/modules/userApi";
import "../../styles/admin/registroAdmin.css";

// Configuración base del formulario.
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
  cantidadParqueaderos: "",
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
    description: "Relaciona al usuario con su ubicación dentro del conjunto.",
    checklist: [
      "Registrar torre y apartamento",
      "Dejar listo el perfil para futuras actualizaciones",
    ],
  },
  Vigilante: {
    title: "Perfil de vigilancia",
    description:
      "Incluye datos operativos y el tipo de sangre. La tarifa por hora se configura desde vigilancia.",
    checklist: [
      "Registrar zona de vigilancia",
      "Guardar tipo de sangre",
      "Definir cantidad de parqueaderos",
    ],
  },
  default: {
    title: "Selecciona un rol",
    description: "Primero completa los datos base y luego elige el rol.",
    checklist: [
      "Todos requieren nombres, apellidos y cédula",
      "El formulario cambia según el rol",
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
        {required ? <span>*</span> : null}
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

// Helpers de presentación y validación.
const sanitizeRoleClass = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

const sanitizeCedulaInput = (value) => String(value || "").replace(/\D+/g, "");

const normalizeLocationValue = (value) => {
  const normalizedValue = String(value || "").trim().toUpperCase().replace(/\s+/g, "");

  if (!normalizedValue) {
    return "";
  }

  return /^\d+$/.test(normalizedValue)
    ? String(Number.parseInt(normalizedValue, 10))
    : normalizedValue;
};

const getMissingFields = (currentForm) =>
  [
    { label: "nombres", value: currentForm.nombres },
    { label: "apellidos", value: currentForm.apellidos },
    { label: "cédula", value: currentForm.cedula },
    { label: "correo", value: currentForm.email },
    { label: "rol", value: currentForm.rol },
    { label: "contraseña", value: currentForm.password },
    { label: "confirmación de contraseña", value: currentForm.confirmPassword },
  ]
    .filter((field) => !field.value.trim())
    .map((field) => field.label);

const buildRegisterPayload = (currentForm) => ({
  nombre: `${currentForm.nombres.trim()} ${currentForm.apellidos.trim()}`.trim(),
  nombres: currentForm.nombres.trim(),
  apellidos: currentForm.apellidos.trim(),
  cedula: currentForm.cedula.trim(),
  email: currentForm.email.trim(),
  rol: currentForm.rol,
  password: currentForm.password,
  confirmPassword: currentForm.confirmPassword,
  torre: currentForm.rol === "Residente" ? currentForm.torre.trim() : "",
  apartamento: currentForm.rol === "Residente" ? currentForm.apartamento.trim() : "",
  zonaVigilancia: currentForm.rol === "Vigilante" ? currentForm.zonaVigilancia.trim() : "",
  tipoSangre: currentForm.rol === "Vigilante" ? currentForm.tipoSangre.trim() : "",
  cantidadParqueaderos:
    currentForm.rol === "Vigilante" ? Number(currentForm.cantidadParqueaderos) : "",
});

const validateForm = (currentForm) => {
  const missingFields = getMissingFields(currentForm);

  if (missingFields.length > 0) {
    return `Completa estos campos: ${missingFields.join(", ")}.`;
  }

  if (!/^\d+$/.test(currentForm.cedula.trim())) {
    return "La cedula solo puede contener numeros.";
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
      !currentForm.cantidadParqueaderos.trim())
  ) {
    return "Para un vigilante debes registrar zona de vigilancia, tipo de sangre y cantidad de parqueaderos.";
  }

  if (currentForm.rol === "Vigilante") {
    const cantidadParqueaderosText = currentForm.cantidadParqueaderos.trim();
    const cantidadParqueaderos = Number(cantidadParqueaderosText);

    if (!/^\d+$/.test(cantidadParqueaderosText) || cantidadParqueaderos <= 0) {
      return "La cantidad de parqueaderos del vigilante debe ser un entero mayor a 0.";
    }
  }

  if (currentForm.password !== currentForm.confirmPassword) {
    return "Las contraseñas no coinciden.";
  }

  if (currentForm.password.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }

  return "";
};

const ensureResidentLocationIsAvailable = async (currentForm) => {
  if (currentForm.rol !== "Residente") {
    return;
  }

  const residents = await getResidents();
  const torre = normalizeLocationValue(currentForm.torre);
  const apartamento = normalizeLocationValue(currentForm.apartamento);
  const residentExists = residents.some(
    (resident) =>
      normalizeLocationValue(resident.torre) === torre &&
      normalizeLocationValue(resident.apartamento) === apartamento
  );

  if (residentExists) {
    throw new Error(
      `Ya existe un residente registrado en la torre ${torre} apartamento ${apartamento}.`
    );
  }
};

export default function RegistroAdminPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const selectedRoleDetails = roleDetails[form.rol] || roleDetails.default;
  const roleClassName = form.rol ? `is-${sanitizeRoleClass(form.rol)}` : "";

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "cedula" || name === "cantidadParqueaderos"
        ? sanitizeCedulaInput(value)
        : value;

    setForm((currentForm) => {
      if (name !== "rol") {
        return {
          ...currentForm,
          [name]: nextValue,
        };
      }

      return {
        ...currentForm,
        rol: nextValue,
        torre: nextValue === "Residente" ? currentForm.torre : "",
        apartamento: nextValue === "Residente" ? currentForm.apartamento : "",
        zonaVigilancia: nextValue === "Vigilante" ? currentForm.zonaVigilancia : "",
        tipoSangre: nextValue === "Vigilante" ? currentForm.tipoSangre : "",
        cantidadParqueaderos: nextValue === "Vigilante" ? currentForm.cantidadParqueaderos : "",
      };
    });
  };

  const resetForm = () => {
    setForm(initialForm);
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

    setLoading(true);

    try {
      await ensureResidentLocationIsAvailable(form);
      const payload = buildRegisterPayload(form);
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
              <h2>Información del usuario</h2>
              <p>Completa los datos base y agrega los campos que cambian según el rol.</p>
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
                    label="Cédula"
                    value={form.cedula}
                    onChange={handleChange}
                    placeholder="Número de cédula"
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
                  <h3>Rol y configuración</h3>
                  <p>El formulario mostrará aquí los campos especiales.</p>
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

                  {form.rol === "Residente" ? (
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
                  ) : null}

                  {form.rol === "Vigilante" ? (
                    <>
                      <FormField
                        id="zonaVigilancia"
                        name="zonaVigilancia"
                        label="Zona de vigilancia"
                        value={form.zonaVigilancia}
                        onChange={handleChange}
                        placeholder="Ej. Portería principal"
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
                        id="cantidadParqueaderos"
                        type="number"
                        name="cantidadParqueaderos"
                        label="Cantidad de parqueaderos"
                        value={form.cantidadParqueaderos}
                        onChange={handleChange}
                        placeholder="Ej. 20"
                        required
                        min="1"
                        step="1"
                        inputMode="numeric"
                        disabled={loading}
                      />
                    </>
                  ) : null}

                  {form.rol === "Administrador" ? (
                    <div className="admin-register-empty-state">
                      <strong>Sin campos extra para este rol</strong>
                      <p>
                        El perfil administrativo solo necesita datos personales, correo y
                        credenciales de acceso.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="admin-register-group">
                <div className="admin-register-group-head">
                  <h3>Credenciales</h3>
                  <p>Define la contraseña inicial del usuario.</p>
                </div>

                <div className="admin-register-grid">
                  <FormField
                    id="password"
                    type="password"
                    name="password"
                    label="Contraseña"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <FormField
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    label="Confirmar contraseña"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite la contraseña"
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
