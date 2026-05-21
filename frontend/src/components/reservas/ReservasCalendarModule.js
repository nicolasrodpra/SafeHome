// Componente principal del módulo de reservas.
// Muestra calendario, detalle por día, formulario de reserva
// y, si es residente, sus próximas reservas.
import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import useSession from "../../hooks/useSession";
import { getUserProfile } from "../../services/modules/userApi";
import {
  createReserva,
  deleteReserva,
  getReservas,
  updateReserva,
} from "../../services/modules/reservasApi";
import {
  CALENDAR_DAY_NAMES,
  MINI_CALENDAR_DAY_NAMES,
  RESERVA_ZONAS,
  addMonths,
  buildMiniCalendarDays,
  buildMonthCells,
  canManageReservation,
  formatDateKey,
  formatHourLabel,
  formatReservationRange,
  getAvailableDurations,
  getAvailableStartHours,
  getFullDateLabel,
  getMonthLabel,
  getReservationValidation,
  getZoneMeta,
  isSharedCapacityZone,
  isDateKeyInMonth,
  isPastDateKey,
  MAX_SHARED_ZONE_RESIDENTS,
  parseDateKey,
  sortReservationsByTime,
  startOfMonth,
} from "../../utils/reservasCommon";
import "../../styles/shared/reservasModule.css";

function ReservationChip({ reservation, isOwner }) {
  const zoneMeta = getZoneMeta(reservation.zoneKey);
  const zoneClassName = zoneMeta ? `is-${zoneMeta.colorToken}` : "";
  const itemClassName = zoneClassName ? `reservas-chip ${zoneClassName}` : "reservas-chip";

  return (
    <div className={itemClassName}>
      <div className="reservas-chip-main">
        <strong>{reservation.zoneLabel}</strong>
        <span>{formatReservationRange(reservation.startHour, reservation.endHour)}</span>
      </div>
      {isOwner ? <em>Mi reserva</em> : null}
    </div>
  );
}

function SelectedDayReservationItem({
  reservation,
  isResidentMode,
  isOwner,
  canEdit,
  canCancel,
  isEditing,
  onEdit,
  onCancel,
}) {
  const zoneMeta = getZoneMeta(reservation.zoneKey);
  const zoneClassName = zoneMeta ? `is-${zoneMeta.colorToken}` : "";
  const itemClassName = ["reservas-day-item", zoneClassName, isEditing ? "is-editing" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={itemClassName}>
      <div className="reservas-day-item-top">
        <div className="reservas-day-item-top-copy">
          <strong>{reservation.zoneLabel}</strong>
          <span>{formatReservationRange(reservation.startHour, reservation.endHour)}</span>
        </div>
        <div className="reservas-day-item-top-right">
          {isOwner ? <em>{isResidentMode ? "Mi reserva" : "Reserva propia"}</em> : null}
          {canEdit ? (
            <button
              type="button"
              className="reservas-icon-button"
              onClick={() => onEdit(reservation)}
              aria-label={`Editar reserva de ${reservation.zoneLabel}`}
              title="Editar reserva"
            >
              <i className="ph-light ph-pencil-simple" aria-hidden="true"></i>
            </button>
          ) : null}
        </div>
      </div>

      {isResidentMode ? null : (
        <div className="reservas-day-item-meta">
          <span>{reservation.residentName || "Residente"}</span>
          <span>
            Torre {reservation.torre || "-"} / Apto. {reservation.apartamento || "-"}
          </span>
          <span>Cédula {reservation.cedula || "No registrada"}</span>
        </div>
      )}

      {canCancel ? (
        <div className="reservas-day-item-actions">
          <button
            type="button"
            className="reservas-inline-button"
            onClick={() => onCancel(reservation)}
          >
            Cancelar
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function ReservasCalendarModule({ mode }) {
  const isResidentMode = mode === "resident";
  const isAdminMode = mode === "admin";
  const canManageReservations = isResidentMode || isAdminMode;
  const session = useSession();
  const formSectionRef = useRef(null);
  const [reservas, setReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(canManageReservations);
  const [userProfile, setUserProfile] = useState(null);
  const [editingReservation, setEditingReservation] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));
  const [selectedZoneKey, setSelectedZoneKey] = useState(RESERVA_ZONAS[0].key);
  const [residentNameInput, setResidentNameInput] = useState("");
  const [cedulaInput, setCedulaInput] = useState("");
  const [startHour, setStartHour] = useState("");
  const [duration, setDuration] = useState("");

  const loadReservas = async () => {
    try {
      const nextReservas = await getReservas();
      setReservas(nextReservas);
    } catch (error) {
      setReservas([]);
    } finally {
      setLoadingReservas(false);
    }
  };

  useEffect(() => {
    loadReservas();
  }, []);

  useEffect(() => {
    if (!canManageReservations) {
      setProfileLoading(false);
      return;
    }

    let active = true;

    const loadProfile = async () => {
      if (!session?.uid) {
        if (active) {
          setUserProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      try {
        const profile = await getUserProfile(session.uid);

        if (active) {
          setUserProfile({
            userId: profile.uid,
            nombre: profile.nombre,
            cedula: profile.cedula,
            torre: profile.torre,
            apartamento: profile.apartamento,
            email: profile.email,
            rol: profile.rol,
          });
          setProfileLoading(false);
        }
      } catch (error) {
        if (active) {
          setUserProfile({
            userId: session.uid,
            nombre: session.nombre || (isAdminMode ? "AdministraciÃ³n" : "Residente"),
            cedula: session.cedula || "",
            torre: session.torre || "",
            apartamento: session.apartamento || "",
            email: session.email || "",
            rol: session.rol || (isAdminMode ? "Administrador" : "Residente"),
          });
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [canManageReservations, isAdminMode, session]);

  useEffect(() => {
    if (editingReservation) {
      return;
    }

    setResidentNameInput(userProfile?.nombre || "");
    setCedulaInput(userProfile?.cedula || "");
  }, [editingReservation, userProfile]);

  const monthCells = useMemo(() => buildMonthCells(currentMonth), [currentMonth]);
  const miniCalendarDays = useMemo(() => buildMiniCalendarDays(currentMonth), [currentMonth]);

  const monthReservations = useMemo(
    () => reservas.filter((reservation) => isDateKeyInMonth(reservation.dateKey, currentMonth)),
    [currentMonth, reservas]
  );

  const totalMonthReservations = monthReservations.length;
  const occupiedDaysCount = useMemo(
    () => new Set(monthReservations.map((reservation) => reservation.dateKey)).size,
    [monthReservations]
  );

  // Agrupamos las reservas por fecha para que cada celda del calendario
  // consulte solo su lista local y no tenga que filtrar todo el arreglo otra vez.
  const reservationsByDate = useMemo(() => {
    const groupedReservations = {};

    monthReservations.forEach((reservation) => {
      if (!groupedReservations[reservation.dateKey]) {
        groupedReservations[reservation.dateKey] = [];
      }

      groupedReservations[reservation.dateKey].push(reservation);
      groupedReservations[reservation.dateKey].sort(sortReservationsByTime);
    });

    return groupedReservations;
  }, [monthReservations]);

  const selectedDayReservations = useMemo(
    () =>
      reservas
        .filter((reservation) => reservation.dateKey === selectedDateKey)
        .sort(sortReservationsByTime),
    [reservas, selectedDateKey]
  );

  const availableStartHours = useMemo(
    () => getAvailableStartHours(selectedDateKey, new Date()),
    [selectedDateKey]
  );

  useEffect(() => {
    if (availableStartHours.length === 0) {
      setStartHour("");
      return;
    }

    const currentStartHour = Number(startHour);

    if (!availableStartHours.includes(currentStartHour)) {
      setStartHour(String(availableStartHours[0]));
    }
  }, [availableStartHours, startHour]);

  const availableDurations = useMemo(
    () => getAvailableDurations(selectedZoneKey, Number(startHour)),
    [selectedZoneKey, startHour]
  );

  useEffect(() => {
    if (availableDurations.length === 0) {
      setDuration("");
      return;
    }

    const currentDuration = Number(duration);

    if (!availableDurations.includes(currentDuration)) {
      setDuration(String(availableDurations[0]));
    }
  }, [availableDurations, duration]);

  const selectedZone = getZoneMeta(selectedZoneKey);
  const isEditingReservation = Boolean(editingReservation);
  const selectedDate = parseDateKey(selectedDateKey);
  const selectedDateIsPast = isPastDateKey(selectedDateKey, new Date());
  const canSubmitReservation =
    canManageReservations &&
    !profileLoading &&
    !!session?.uid &&
    !!selectedZone &&
    !!startHour &&
    !!duration &&
    !selectedDateIsPast;

  const selectedZoneHeaderCopy = selectedZone
    ? isSharedCapacityZone(selectedZone.key)
      ? `Hasta ${MAX_SHARED_ZONE_RESIDENTS} residentes por horario`
      : `Máx. ${selectedZone.maxHours} hora(s)`
    : "Selecciona una zona";

  const selectedZonePolicyCopy = selectedZone
    ? isSharedCapacityZone(selectedZone.key)
      ? `${selectedZone.maxHours} hora(s) máximas por residente y ${MAX_SHARED_ZONE_RESIDENTS} cupos simultáneos`
      : `${selectedZone.maxHours} hora(s) máximas por residente`
    : "Sin zona seleccionada";

  const focusReservationForm = () => {
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const clearEditingReservation = ({ resetForm = false } = {}) => {
    setEditingReservation(null);

    if (resetForm) {
      setSelectedZoneKey(RESERVA_ZONAS[0].key);
      setStartHour("");
      setDuration("");
      setResidentNameInput(userProfile?.nombre || "");
      setCedulaInput(userProfile?.cedula || "");
    }
  };

  const handleChangeMonth = (direction) => {
    const nextMonth = addMonths(currentMonth, direction);
    const nextSelectedDay = Math.min(
      selectedDate.getDate(),
      new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
    );
    const nextSelectedDate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      nextSelectedDay
    );

    setCurrentMonth(nextMonth);
    setSelectedDateKey(formatDateKey(nextSelectedDate));
  };

  const handleStartEditing = (reservation) => {
    if (!session?.uid || !canManageReservation(reservation, session.uid, new Date())) {
      Swal.fire({
        title: "No disponible",
        text: "Solo puedes editar tus propias reservas futuras.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setEditingReservation(reservation);
    setCurrentMonth(startOfMonth(parseDateKey(reservation.dateKey)));
    setSelectedDateKey(reservation.dateKey);
    setSelectedZoneKey(reservation.zoneKey);
    setResidentNameInput(reservation.residentName || userProfile?.nombre || "");
    setCedulaInput(reservation.cedula || userProfile?.cedula || "");
    setStartHour(String(reservation.startHour));
    setDuration(String(reservation.duration));
    focusReservationForm();
  };

  const handleSubmitReservation = async (event) => {
    event.preventDefault();

    if (!session?.uid || !userProfile || !canManageReservations) {
      Swal.fire({
        title: "Acceso no permitido",
        text: "Solo los residentes y la administraciÃ³n pueden gestionar reservas.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    if (
      isEditingReservation &&
      !canManageReservation(editingReservation, session.uid, new Date())
    ) {
      Swal.fire({
        title: "No disponible",
        text: "La reserva que intentas editar ya no puede modificarse.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      clearEditingReservation({ resetForm: true });
      return;
    }

    const startHourValue = Number(startHour);
    const durationValue = Number(duration);
    const defaultReservationName =
      userProfile?.rol === "Administrador" ? "AdministraciÃ³n" : "Residente";
    const residentNameValue =
      residentNameInput.trim() || userProfile?.nombre || defaultReservationName;
    const cedulaValue = cedulaInput.trim() || userProfile?.cedula || "";
    const validation = getReservationValidation({
      reservations: reservas,
      dateKey: selectedDateKey,
      zoneKey: selectedZoneKey,
      startHour: startHourValue,
      duration: durationValue,
      userId: session.uid,
      reservationId: editingReservation?.id,
      baseDate: new Date(),
    });

    if (!validation.valid) {
      Swal.fire({
        title: isEditingReservation ? "No se pudo actualizar" : "No se pudo reservar",
        text: validation.message,
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        dateKey: selectedDateKey,
        zoneKey: selectedZoneKey,
        zoneLabel: selectedZone.label,
        startHour: startHourValue,
        endHour: startHourValue + durationValue,
        duration: durationValue,
        userId: session.uid,
        residentName: residentNameValue,
        residentEmail: userProfile.email || session?.email || "",
        cedula: cedulaValue,
        torre: userProfile.torre || "",
        apartamento: userProfile.apartamento || "",
      };

      if (isEditingReservation) {
        await updateReserva(editingReservation.id, payload);
      } else {
        await createReserva(payload);
      }

      await loadReservas();

      if (isEditingReservation) {
        clearEditingReservation({ resetForm: true });
      }

      Swal.fire({
        title: isEditingReservation ? "Reserva actualizada" : "Reserva creada",
        text: isEditingReservation
          ? `La reserva de ${selectedZone.label} se actualizó correctamente.`
          : `La reserva de ${selectedZone.label} quedó registrada correctamente.`,
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo guardar la reserva.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservation) => {
    if (!session?.uid || !canManageReservation(reservation, session.uid, new Date())) {
      Swal.fire({
        title: "No disponible",
        text: "Solo puedes cancelar tus propias reservas futuras.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Cancelar reserva",
      text: `Se cancelará la reserva de ${reservation.zoneLabel} del ${getFullDateLabel(
        reservation.dateKey
      )}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#460669",
      cancelButtonColor: "#d33",
      confirmButtonText: "Cancelar reserva",
      cancelButtonText: "Volver",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteReserva(reservation.id);
      await loadReservas();

      if (editingReservation?.id === reservation.id) {
        clearEditingReservation({ resetForm: true });
      }

      Swal.fire({
        title: "Reserva cancelada",
        text: "La reserva se eliminó correctamente.",
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo cancelar la reserva.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    }
  };

  return (
    <div className={`reservas-page ${isResidentMode ? "is-resident-mode" : "is-admin-mode"}`}>
      <header className="reservas-page-header">
        <div className="reservas-page-header-copy">
          <h1 className="internal-page-title">Reservas de zonas comunes</h1>
          <p className="reservas-page-copy">
            {isResidentMode
              ? "Reserva piscina, gimnasio, salón comunal, cancha o zona BBQ con validaciones de horario, cruces y límite de horas por zona."
              : "Consulta en tiempo real las reservas registradas y crea reservas administrativas cuando sea necesario, manteniendo las mismas validaciones de horario y disponibilidad."}
          </p>
        </div>

        {isResidentMode ? null : (
          <div className="reservas-hero-stats">
            <article className="reservas-hero-stat">
              <span>Reservas del mes</span>
              <strong>{totalMonthReservations}</strong>
            </article>
            <article className="reservas-hero-stat">
              <span>Días ocupados</span>
              <strong>{occupiedDaysCount}</strong>
            </article>
            <article className="reservas-hero-stat">
              <span>Seleccionado</span>
              <strong>{selectedDayReservations.length}</strong>
            </article>
          </div>
        )}
      </header>

      <div className="reservas-shell">
        <section className="reservas-calendar-panel">
          <div className="reservas-calendar-topbar">
            <div>
              <h2>{getMonthLabel(currentMonth)}</h2>
              <p>Horario habilitado de 7:00 a. m. a 10:00 p. m.</p>
            </div>

            <div className="reservas-month-controls">
              <button type="button" onClick={() => handleChangeMonth(-1)} aria-label="Mes anterior">
                <i className="ph-light ph-caret-left"></i>
              </button>
              <button type="button" onClick={() => handleChangeMonth(1)} aria-label="Mes siguiente">
                <i className="ph-light ph-caret-right"></i>
              </button>
            </div>
          </div>

          <div className="reservas-active-date">
            <span>Fecha activa:</span>
            <strong>{getFullDateLabel(selectedDateKey)}</strong>
          </div>

          <div className="reservas-zone-legend">
            {RESERVA_ZONAS.map((zone) => (
              <div key={zone.key} className={`reservas-legend-item is-${zone.colorToken}`}>
                <span className="reservas-legend-dot"></span>
                <small>{zone.label}</small>
              </div>
            ))}
          </div>

          <div className="reservas-calendar-grid">
            {CALENDAR_DAY_NAMES.map((dayName) => (
              <div key={dayName} className="reservas-calendar-day-name">
                {dayName}
              </div>
            ))}

            {monthCells.map((cell, index) => {
              if (!cell) {
                return <div key={`blank-${index}`} className="reservas-calendar-cell is-empty"></div>;
              }

              const cellReservations = reservationsByDate[cell.dateKey] || [];
              const isSelected = cell.dateKey === selectedDateKey;
              const isToday = cell.dateKey === formatDateKey(new Date());
              const isPast = isPastDateKey(cell.dateKey, new Date());
              const isBlocked = isPast && !isAdminMode;
              const cellClassName = [
                "reservas-calendar-cell",
                isSelected ? "is-selected" : "",
                isToday ? "is-today" : "",
                isPast ? "is-past" : "",
                isBlocked ? "is-blocked" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  className={cellClassName}
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  disabled={isBlocked}
                  aria-label={`${getFullDateLabel(cell.dateKey)} con ${cellReservations.length} reserva(s)`}
                  title={`${cellReservations.length} reserva(s) registradas`}
                >
                  <span className="reservas-calendar-cell-day">{cell.dayNumber}</span>

                  <div className="reservas-calendar-events">
                    {cellReservations.slice(0, 2).map((reservation) => (
                      <ReservationChip
                        key={reservation.id}
                        reservation={reservation}
                        isOwner={reservation.userId === session?.uid}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="reservas-side-panel">
          <section className="reservas-mini-calendar">
            <div className="reservas-mini-calendar-head">
              <strong>{getMonthLabel(currentMonth)}</strong>
              <div className="reservas-mini-controls">
                <button type="button" onClick={() => handleChangeMonth(-1)} aria-label="Mes anterior">
                  <i className="ph-light ph-caret-left"></i>
                </button>
                <button type="button" onClick={() => handleChangeMonth(1)} aria-label="Mes siguiente">
                  <i className="ph-light ph-caret-right"></i>
                </button>
              </div>
            </div>

            <div className="reservas-mini-days">
              {MINI_CALENDAR_DAY_NAMES.map((dayName) => (
                <span key={dayName}>{dayName}</span>
              ))}
            </div>

            <div className="reservas-mini-grid">
              {miniCalendarDays.map((day, index) => {
                if (!day) {
                  return <span key={`mini-blank-${index}`} className="reservas-mini-empty"></span>;
                }

                const buttonClassName = [
                  "reservas-mini-day",
                  day.dateKey === selectedDateKey ? "is-selected" : "",
                  day.dateKey === formatDateKey(new Date()) ? "is-today" : "",
                  isPastDateKey(day.dateKey, new Date()) && !isAdminMode ? "is-blocked" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const isMiniBlocked = isPastDateKey(day.dateKey, new Date()) && !isAdminMode;

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    className={buttonClassName}
                    onClick={() => setSelectedDateKey(day.dateKey)}
                    disabled={isMiniBlocked}
                  >
                    {day.dayNumber}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="reservas-side-section">
            <div className="reservas-side-section-head">
              <h3>{getFullDateLabel(selectedDateKey)}</h3>
              <span>{selectedDayReservations.length} reserva(s)</span>
            </div>

            <div className="reservas-day-list">
              {loadingReservas ? (
                <p className="reservas-empty-state">Cargando reservas...</p>
              ) : selectedDayReservations.length === 0 ? (
                <p className="reservas-empty-state">No hay reservas registradas para este día.</p>
              ) : (
                selectedDayReservations.map((reservation) => (
                  <SelectedDayReservationItem
                    key={reservation.id}
                    reservation={reservation}
                    isResidentMode={isResidentMode}
                    isOwner={reservation.userId === session?.uid}
                    canEdit={
                      canManageReservations &&
                      canManageReservation(reservation, session?.uid, new Date())
                    }
                    canCancel={
                      canManageReservations &&
                      canManageReservation(reservation, session?.uid, new Date())
                    }
                    isEditing={editingReservation?.id === reservation.id}
                    onEdit={handleStartEditing}
                    onCancel={handleCancelReservation}
                  />
                ))
              )}
            </div>
          </section>

          {canManageReservations ? (
            <section className="reservas-side-section" ref={formSectionRef}>
              <div className="reservas-side-section-head">
                <h3>{isEditingReservation ? "Editar reserva" : "Crear reserva"}</h3>
                <span>
                  {selectedZone ? `Máx. ${selectedZone.maxHours} hora(s)` : "Selecciona una zona"}
                </span>
              </div>

              <p className="reservas-form-note">{selectedZoneHeaderCopy}</p>

              <form className="reservas-form" onSubmit={handleSubmitReservation}>
                {isEditingReservation ? (
                  <div className="reservas-edit-banner">
                    <div>
                      <strong>Editando tu reserva</strong>
                      <p>Actualiza la fecha, la zona o el horario y luego guarda los cambios.</p>
                    </div>

                    <button
                      type="button"
                      className="reservas-text-button"
                      onClick={() => clearEditingReservation({ resetForm: true })}
                    >
                      Cancelar edición
                    </button>
                  </div>
                ) : null}

                <div className="reservas-zone-selector">
                  {RESERVA_ZONAS.map((zone) => {
                    const isActive = zone.key === selectedZoneKey;
                    const zoneClassName = [
                      "reservas-zone-button",
                      `is-${zone.colorToken}`,
                      isActive ? "is-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <button
                        key={zone.key}
                        type="button"
                        className={zoneClassName}
                        onClick={() => setSelectedZoneKey(zone.key)}
                      >
                        {zone.label}
                      </button>
                    );
                  })}
                </div>

                <div className="reservas-readonly-grid">
                  <label>
                    Fecha
                    <input type="text" value={getFullDateLabel(selectedDateKey)} disabled />
                  </label>
                  <label>
                    Nombre
                    <input
                      type="text"
                      value={profileLoading ? "Cargando..." : residentNameInput}
                      onChange={(event) => setResidentNameInput(event.target.value)}
                      disabled={profileLoading}
                    />
                  </label>
                  <label>
                    Cédula
                    <input
                      type="text"
                      value={profileLoading ? "Cargando..." : cedulaInput}
                      onChange={(event) => setCedulaInput(event.target.value)}
                      disabled={profileLoading}
                    />
                  </label>
                  <label>
                    Torre
                    <input type="text" value={profileLoading ? "Cargando..." : userProfile?.torre || ""} disabled />
                  </label>
                  <label>
                    Apartamento
                    <input
                      type="text"
                      value={profileLoading ? "Cargando..." : userProfile?.apartamento || ""}
                      disabled
                    />
                  </label>
                  <label>
                    Correo
                    <input
                      type="text"
                      value={profileLoading ? "Cargando..." : userProfile?.email || ""}
                      disabled
                    />
                  </label>
                </div>

                <div className="reservas-time-grid">
                  <label>
                    Hora de inicio
                    <select
                      value={startHour}
                      onChange={(event) => setStartHour(event.target.value)}
                      disabled={availableStartHours.length === 0}
                    >
                      {availableStartHours.length === 0 ? (
                        <option value="">Sin horarios</option>
                      ) : (
                        availableStartHours.map((hourOption) => (
                          <option key={hourOption} value={hourOption}>
                            {formatHourLabel(hourOption)}
                          </option>
                        ))
                      )}
                    </select>
                  </label>

                  <label>
                    Duración
                    <select
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      disabled={availableDurations.length === 0}
                    >
                      {availableDurations.length === 0 ? (
                        <option value="">Sin opciones</option>
                      ) : (
                        availableDurations.map((durationOption) => (
                          <option key={durationOption} value={durationOption}>
                            {durationOption} hora(s)
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                </div>

                <div className="reservas-form-summary">
                  <span>Zona</span>
                  <strong>{selectedZone?.label || "Selecciona una zona"}</strong>
                  <span>Horario</span>
                  <strong>
                    {startHour && duration
                      ? formatReservationRange(
                          Number(startHour),
                          Number(startHour) + Number(duration)
                        )
                      : "Selecciona hora y duración"}
                  </strong>
                  <span>Política</span>
                  <strong>
                    {selectedZone
                      ? `${selectedZone.maxHours} hora(s) máximas por usuario`
                      : "Sin zona seleccionada"}
                  </strong>
                </div>

                <p className="reservas-form-note">{selectedZonePolicyCopy}</p>

                <button
                  type="submit"
                  className="reservas-submit-button"
                  disabled={!canSubmitReservation || submitting}
                >
                  {selectedDateIsPast
                    ? "Fecha bloqueada"
                    : submitting
                    ? isEditingReservation
                      ? "Actualizando..."
                      : "Guardando..."
                    : isEditingReservation
                    ? "Actualizar reserva"
                    : "Reservar"}
                </button>
              </form>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
