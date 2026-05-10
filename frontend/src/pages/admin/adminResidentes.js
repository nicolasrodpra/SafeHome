import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import InternalLayout from "../../layouts/InternalLayout";
import {
  deleteResidentByAdmin,
  getResidents,
  updateResidentByAdmin,
} from "../../services/modules/userApi";
import "../../styles/admin/adminResidentes.css";

const EMPTY_FORM = {
  nombres: "",
  apellidos: "",
  cedula: "",
  email: "",
  torre: "",
  apartamento: "",
};

const getTemporaryLocation = (index) => {
  const apartamentosPorPiso = 4;
  const pisosPorTorre = 10;
  const apartamentosPorTorre = apartamentosPorPiso * pisosPorTorre;
  const torre = String(Math.floor(index / apartamentosPorTorre) + 1).padStart(2, "0");
  const piso = Math.floor((index % apartamentosPorTorre) / apartamentosPorPiso) + 1;
  const numero = String((index % apartamentosPorPiso) + 1).padStart(2, "0");

  return {
    torre,
    apartamento: `${piso}${numero}`,
  };
};

const compareByText = (firstValue = "", secondValue = "") =>
  firstValue.localeCompare(secondValue, "es", {
    numeric: true,
    sensitivity: "base",
  });

const getSortableNumber = (value) => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  const match = normalizedValue.match(/\d+/);

  return match ? Number.parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
};

const compareSortableNumbers = (firstValue, secondValue) => {
  if (firstValue === secondValue) {
    return 0;
  }

  if (!Number.isFinite(firstValue)) {
    return 1;
  }

  if (!Number.isFinite(secondValue)) {
    return -1;
  }

  return firstValue - secondValue;
};

const compareResidentsByLocation = (firstResident, secondResident) => {
  const towerDiff = compareSortableNumbers(
    getSortableNumber(firstResident?.torre),
    getSortableNumber(secondResident?.torre)
  );

  if (towerDiff !== 0) {
    return towerDiff;
  }

  const apartmentDiff = compareSortableNumbers(
    getSortableNumber(firstResident?.apartamento),
    getSortableNumber(secondResident?.apartamento)
  );

  if (apartmentDiff !== 0) {
    return apartmentDiff;
  }

  const towerTextDiff = compareByText(firstResident?.torre || "", secondResident?.torre || "");

  if (towerTextDiff !== 0) {
    return towerTextDiff;
  }

  const apartmentTextDiff = compareByText(
    firstResident?.apartamento || "",
    secondResident?.apartamento || ""
  );

  if (apartmentTextDiff !== 0) {
    return apartmentTextDiff;
  }

  const nameDiff = compareByText(firstResident?.nombre || "", secondResident?.nombre || "");

  if (nameDiff !== 0) {
    return nameDiff;
  }

  return compareByText(firstResident?.uid || "", secondResident?.uid || "");
};

function ResidentCell({ label, children, className = "" }) {
  const classes = className ? `resident-cell ${className}` : "resident-cell";
  return (
    <div className={classes} data-label={label}>
      {children}
    </div>
  );
}

function ResidentModal({ isOpen, form, loading, onClose, onChange, onSubmit }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="resident-modal-overlay" onClick={onClose}>
      <div className="resident-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="resident-modal-head">
          <div>
            <span className="resident-modal-kicker">Administración</span>
            <h2>Editar residente</h2>
            <p>Actualiza datos personales y ubicación antes de guardar los cambios.</p>
          </div>

          <button type="button" className="resident-modal-close" onClick={onClose}>
            <i className="ph-light ph-x"></i>
          </button>
        </div>

        <div className="resident-modal-grid">
          <label>
            Nombres
            <input name="nombres" value={form.nombres} onChange={onChange} />
          </label>

          <label>
            Apellidos
            <input name="apellidos" value={form.apellidos} onChange={onChange} />
          </label>

          <label>
            Cédula
            <input name="cedula" value={form.cedula} onChange={onChange} inputMode="numeric" />
          </label>

          <label>
            Correo
            <input name="email" type="email" value={form.email} onChange={onChange} />
          </label>

          <label>
            Torre
            <input name="torre" value={form.torre} onChange={onChange} />
          </label>

          <label>
            Apartamento
            <input name="apartamento" value={form.apartamento} onChange={onChange} />
          </label>
        </div>

        <div className="resident-modal-actions">
          <button type="button" className="resident-modal-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="resident-modal-primary" onClick={onSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminResidentes() {
  const [residentes, setResidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingResident, setEditingResident] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadResidents = async () => {
    try {
      const residents = await getResidents();
      setResidentes([...residents].sort(compareResidentsByLocation));
    } catch (error) {
      setResidentes([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    loadResidents();
  }, []);

  const handleOpenEdit = (resident) => {
    setEditingResident(resident);
    setForm({
      nombres: resident.nombres || "",
      apellidos: resident.apellidos || "",
      cedula: resident.cedula || "",
      email: resident.email || "",
      torre: resident.torre || "",
      apartamento: resident.apartamento || "",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const closeModal = (force = false) => {
    if (saving && !force) {
      return;
    }

    setEditingResident(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!editingResident) {
      return;
    }

    if (
      !form.nombres.trim() ||
      !form.apellidos.trim() ||
      !form.cedula.trim() ||
      !form.email.trim() ||
      !form.torre.trim() ||
      !form.apartamento.trim()
    ) {
      Swal.fire({
        title: "Campos incompletos",
        text: "Completa todos los campos del residente antes de guardar.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setSaving(true);

    try {
      await updateResidentByAdmin(editingResident.uid, {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        cedula: form.cedula.trim(),
        email: form.email.trim(),
        torre: form.torre.trim(),
        apartamento: form.apartamento.trim(),
      });

      await loadResidents();
      closeModal(true);

      Swal.fire({
        title: "Residente actualizado",
        text: "Los datos del residente fueron actualizados correctamente.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo actualizar el residente.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resident) => {
    const result = await Swal.fire({
      title: "¿Eliminar residente?",
      text: `Se eliminará la cuenta de ${resident.nombre || "este residente"}.`,
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

    setDeletingId(resident.uid);

    try {
      await deleteResidentByAdmin(resident.uid);
      await loadResidents();

      if (editingResident?.uid === resident.uid) {
        closeModal();
      }

      Swal.fire({
        title: "Residente eliminado",
        text: "La cuenta del residente fue eliminada correctamente.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo eliminar el residente.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setDeletingId("");
    }
  };

  return (
    <InternalLayout>
      <div className="admin-residentes-page">
        <div className="admin-residentes-hero">
          <div>
            <h1 className="internal-page-title">Residentes</h1>
            <p className="admin-residentes-copy">
              Consulta, edita o elimina usuarios registrados con rol de residente desde una sola
              vista administrativa.
            </p>
          </div>

          <div className="admin-residentes-summary">
            <span>Total de residentes</span>
            <strong>{residentes.length}</strong>
          </div>
        </div>

        <div className="admin-residentes-table-shell">
          <div className="admin-residentes-table-head">
            <span>ID</span>
            <span>Nombre</span>
            <span>Cédula</span>
            <span>Correo</span>
            <span>Torre</span>
            <span>Apartamento</span>
            <span>Acciones</span>
          </div>

          <div className="admin-residentes-table-body">
            {cargando ? (
              <div className="admin-residentes-empty">
                <i className="ph-light ph-spinner-gap"></i>
                <p>Cargando residentes...</p>
              </div>
            ) : residentes.length === 0 ? (
              <div className="admin-residentes-empty">
                <i className="ph-light ph-users-three"></i>
                <p>No hay residentes registrados todavía.</p>
              </div>
            ) : (
              residentes.map((residente, index) => {
                const ubicacionTemporal = getTemporaryLocation(index);
                const cedula = residente.cedula || "";
                const correo = residente.email || "Sin correo";
                const torre = residente.torre || ubicacionTemporal.torre;
                const apartamento = residente.apartamento || ubicacionTemporal.apartamento;

                return (
                  <article className="resident-row" key={residente.uid}>
                    <ResidentCell label="ID" className="resident-id-cell">
                      <span className="resident-id-badge">{index + 1}</span>
                    </ResidentCell>

                    <ResidentCell label="Nombre">
                      <div className="resident-primary">
                        <strong>{residente.nombre || "Sin nombre registrado"}</strong>
                        <span>{residente.rol}</span>
                      </div>
                    </ResidentCell>

                    <ResidentCell label="Cédula">
                      {cedula ? (
                        <span className="resident-value">{cedula}</span>
                      ) : (
                        <span className="resident-pill resident-pill-muted">Pendiente</span>
                      )}
                    </ResidentCell>

                    <ResidentCell label="Correo" className="resident-email-cell">
                      <span className="resident-value resident-email">{correo}</span>
                    </ResidentCell>

                    <ResidentCell label="Torre">
                      <span className="resident-pill resident-pill-soft">{torre}</span>
                    </ResidentCell>

                    <ResidentCell label="Apartamento">
                      <span className="resident-pill resident-pill-accent">{apartamento}</span>
                    </ResidentCell>

                    <ResidentCell label="Acciones" className="resident-actions-cell">
                      <div className="resident-actions">
                        <button
                          type="button"
                          className="resident-action-button"
                          onClick={() => handleOpenEdit(residente)}
                        >
                          <i className="ph-light ph-pencil-simple"></i>
                        </button>
                        <button
                          type="button"
                          className="resident-action-button danger"
                          onClick={() => handleDelete(residente)}
                          disabled={deletingId === residente.uid}
                        >
                          {deletingId === residente.uid ? "..." : <i className="ph-light ph-trash"></i>}
                        </button>
                      </div>
                    </ResidentCell>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ResidentModal
        isOpen={Boolean(editingResident)}
        form={form}
        loading={saving}
        onClose={closeModal}
        onChange={handleChange}
        onSubmit={handleSave}
      />
    </InternalLayout>
  );
}
