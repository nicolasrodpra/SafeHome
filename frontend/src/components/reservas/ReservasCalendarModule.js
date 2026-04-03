import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Swal from "sweetalert2";
import { auth, db } from "../../config/firebase";
import { createReserva, deleteReserva, subscribeToReservas } from "../../services/reservasService";
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
  isDateKeyInMonth,
  isPastDateKey,
  isUpcomingReservation,
  parseDateKey,
  sortReservationsByTime,
  startOfMonth,
} from "../../utils/reservasCommon";
import "../../styles/shared/reservasModule.css";

const getCachedRole = () => {
  try {
    return localStorage.getItem("safehome_profile_role") || "";
  } catch (error) {
    return "";
  }
};

function ReservationChip({ reservation, isOwner }) {
  const zoneMeta = getZoneMeta(reservation.zoneKey);
  const zoneClassName = zoneMeta ? `is-${zoneMeta.colorToken}` : "";
  const itemClassName = zoneClassName
    ? `reservas-chip ${zoneClassName}`
    : "reservas-chip";

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
  canCancel,
  onCancel,
}) {
  const zoneMeta = getZoneMeta(reservation.zoneKey);
  const zoneClassName = zoneMeta ? `is-${zoneMeta.colorToken}` : "";
  const itemClassName = zoneClassName
    ? `reservas-day-item ${zoneClassName}`
    : "reservas-day-item";

  return (
    <article className={itemClassName}>
      <div className="reservas-day-item-top">
        <div>
          <strong>{reservation.zoneLabel}</strong>
          <span>{formatReservationRange(reservation.startHour, reservation.endHour)}</span>
        </div>
        {isResidentMode && isOwner ? <em>Mi reserva</em> : null}
      </div>

      {isResidentMode ? null : (
        <div className="reservas-day-item-meta">
          <span>{reservation.residentName || "Residente"}</span>
          <span>
            Torre {reservation.torre || "-"} / Apto {reservation.apartamento || "-"}
          </span>
          <span>Cedula {reservation.cedula || "No registrada"}</span>
        </div>
      )}

      {canCancel ? (
        <button
          type="button"
          className="reservas-inline-button"
          onClick={() => onCancel(reservation)}
        >
          Cancelar
        </button>
      ) : null}
    </article>
  );
}

export default function ReservasCalendarModule({ mode }) {
  const isResidentMode = mode === "resident";
  const [user, authLoading] = useAuthState(auth);
  const [reservas, setReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(isResidentMode);
  const [userProfile, setUserProfile] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));
  const [selectedZoneKey, setSelectedZoneKey] = useState(RESERVA_ZONAS[0].key);
  const [startHour, setStartHour] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToReservas(
      (nextReservas) => {
        setReservas(nextReservas);
        setLoadingReservas(false);
      },
      () => {
        setReservas([]);
        setLoadingReservas(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isResidentMode) {
      setProfileLoading(false);
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      if (!user) {
        if (isMounted) {
          setUserProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      if (isMounted) {
        setProfileLoading(true);
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const data = snapshot.exists() ? snapshot.data() : {};
        const resolvedRole = data.rol || getCachedRole() || "Residente";
        const fullName =
          data.nombre ||
          [data.nombres, data.apellidos].filter(Boolean).join(" ").trim() ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "Residente";

        if (isMounted) {
          setUserProfile({
            userId: user.uid,
            nombre: fullName,
            cedula: data.cedula || data.documento || "",
            torre: data.torre || "",
            apartamento: data.apartamento || "",
            email: data.email || user.email || "",
            rol: resolvedRole,
          });
          setProfileLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setUserProfile({
            userId: user.uid,
            nombre: user.displayName || user.email?.split("@")[0] || "Residente",
            cedula: "",
            torre: "",
            apartamento: "",
            email: user.email || "",
            rol: getCachedRole() || "Residente",
          });
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isResidentMode, user]);

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

  const upcomingUserReservations = useMemo(() => {
    if (!user) {
      return [];
    }

    return reservas
      .filter(
        (reservation) =>
          reservation.userId === user.uid && isUpcomingReservation(reservation, new Date())
      )
      .sort(sortReservationsByTime)
      .slice(0, 5);
  }, [reservas, user]);

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
  const selectedDate = parseDateKey(selectedDateKey);
  const selectedDateIsPast = isPastDateKey(selectedDateKey, new Date());
  const canSubmitReservation =
    isResidentMode &&
    !authLoading &&
    !profileLoading &&
    !!user &&
    !!selectedZone &&
    !!startHour &&
    !!duration &&
    !selectedDateIsPast;

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

  const handleSelectDate = (dateKey) => {
    setSelectedDateKey(dateKey);
  };

  const handleCreateReservation = async (event) => {
    event.preventDefault();

    if (!isResidentMode) {
      return;
    }

    if (!user || !userProfile || userProfile.rol !== "Residente") {
      Swal.fire({
        title: "Acceso no permitido",
        text: "Solo los residentes pueden crear reservas.",
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    const startHourValue = Number(startHour);
    const durationValue = Number(duration);
    const validation = getReservationValidation({
      reservations: reservas,
      dateKey: selectedDateKey,
      zoneKey: selectedZoneKey,
      startHour: startHourValue,
      duration: durationValue,
      userId: user.uid,
      baseDate: new Date(),
    });

    if (!validation.valid) {
      Swal.fire({
        title: "No se pudo reservar",
        text: validation.message,
        icon: "warning",
        confirmButtonColor: "#460669",
      });
      return;
    }

    setSubmitting(true);

    try {
      await createReserva({
        dateKey: selectedDateKey,
        zoneKey: selectedZoneKey,
        zoneLabel: selectedZone.label,
        startHour: startHourValue,
        endHour: startHourValue + durationValue,
        duration: durationValue,
        userId: user.uid,
        residentName: userProfile.nombre,
        residentEmail: userProfile.email,
        cedula: userProfile.cedula,
        torre: userProfile.torre,
        apartamento: userProfile.apartamento,
      });

      Swal.fire({
        title: "Reserva creada",
        text: `Tu reserva de ${selectedZone.label} quedo registrada correctamente.`,
        icon: "success",
        confirmButtonColor: "#460669",
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo crear la reserva.",
        icon: "error",
        confirmButtonColor: "#460669",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservation) => {
    if (!user || !canManageReservation(reservation, user.uid, new Date())) {
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
      text: `Se cancelara la reserva de ${reservation.zoneLabel} del ${getFullDateLabel(
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

      Swal.fire({
        title: "Reserva cancelada",
        text: "La reserva se elimino correctamente.",
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
    <div className="reservas-page">
      <header className="reservas-page-header">
        <div className="reservas-page-header-copy">
          <h1 className="internal-page-title">Reservas Zonas Comunes</h1>
          <p className="reservas-page-copy">
            {isResidentMode
              ? "Reserva piscina, gimnasio, salon comunal, cancha o zona BBQ con validaciones de horario, cruces y limite de horas por zona."
              : "Consulta en tiempo real las reservas registradas por los residentes sin posibilidad de crear ni editar eventos."}
          </p>
        </div>

        <div className="reservas-hero-stats">
          <article className="reservas-hero-stat">
            <span>Reservas del mes</span>
            <strong>{totalMonthReservations}</strong>
          </article>
          <article className="reservas-hero-stat">
            <span>Dias ocupados</span>
            <strong>{occupiedDaysCount}</strong>
          </article>
          <article className="reservas-hero-stat">
            <span>Seleccionado</span>
            <strong>{selectedDayReservations.length}</strong>
          </article>
        </div>
      </header>

      <div className="reservas-shell">
        <section className="reservas-calendar-panel">
          <div className="reservas-calendar-topbar">
            <div>
              <h2>{getMonthLabel(currentMonth)}</h2>
              <p>Horario habilitado de 7:00 AM a 10:00 PM.</p>
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
              const isBlocked = isPast;
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
                  onClick={() => handleSelectDate(cell.dateKey)}
                  disabled={isBlocked}
                >
                  <span className="reservas-calendar-cell-day">{cell.dayNumber}</span>

                  <div className="reservas-calendar-events">
                    {cellReservations.slice(0, 3).map((reservation) => (
                      <ReservationChip
                        key={reservation.id}
                        reservation={reservation}
                        isOwner={isResidentMode && reservation.userId === user?.uid}
                      />
                    ))}

                    {cellReservations.length > 3 ? (
                      <span className="reservas-more-badge">
                        +{cellReservations.length - 3} mas
                      </span>
                    ) : null}
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
                  isPastDateKey(day.dateKey, new Date()) ? "is-blocked" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    className={buttonClassName}
                    onClick={() => handleSelectDate(day.dateKey)}
                    disabled={isPastDateKey(day.dateKey, new Date())}
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
                <p className="reservas-empty-state">
                  No hay reservas registradas para este dia.
                </p>
              ) : (
                selectedDayReservations.map((reservation) => (
                  <SelectedDayReservationItem
                    key={reservation.id}
                    reservation={reservation}
                    isResidentMode={isResidentMode}
                    isOwner={reservation.userId === user?.uid}
                    canCancel={
                      isResidentMode && canManageReservation(reservation, user?.uid, new Date())
                    }
                    onCancel={handleCancelReservation}
                  />
                ))
              )}
            </div>
          </section>

          {isResidentMode ? (
            <section className="reservas-side-section">
              <div className="reservas-side-section-head">
                <h3>Crear reserva</h3>
                <span>
                  {selectedZone ? `Max ${selectedZone.maxHours} hora(s)` : "Selecciona una zona"}
                </span>
              </div>

              <form className="reservas-form" onSubmit={handleCreateReservation}>
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
                    <input type="text" value={getFullDateLabel(selectedDateKey)} readOnly />
                  </label>
                  <label>
                    Nombre
                    <input
                      type="text"
                      value={profileLoading ? "Cargando..." : userProfile?.nombre || ""}
                      readOnly
                    />
                  </label>
                  <label>
                    Torre
                    <input
                      type="text"
                      value={profileLoading ? "Cargando..." : userProfile?.torre || ""}
                      readOnly
                    />
                  </label>
                  <label>
                    Apartamento
                    <input
                      type="text"
                      value={profileLoading ? "Cargando..." : userProfile?.apartamento || ""}
                      readOnly
                    />
                  </label>
                  <label>
                    Cedula
                    <input
                      type="text"
                      value={profileLoading ? "Cargando..." : userProfile?.cedula || ""}
                      readOnly
                    />
                  </label>
                  <label>
                    Correo
                    <input
                      type="text"
                      value={profileLoading ? "Cargando..." : userProfile?.email || ""}
                      readOnly
                    />
                  </label>
                </div>

                <div className="reservas-time-grid">
                  <label>
                    Hora inicio
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
                    Duracion
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
                      : "Selecciona hora y duracion"}
                  </strong>
                  <span>Politica</span>
                  <strong>
                    {selectedZone
                      ? `${selectedZone.maxHours} hora(s) maximas por usuario`
                      : "Sin zona seleccionada"}
                  </strong>
                </div>

                <button
                  type="submit"
                  className="reservas-submit-button"
                  disabled={!canSubmitReservation || submitting}
                >
                  {selectedDateIsPast
                    ? "Fecha bloqueada"
                    : submitting
                    ? "Guardando..."
                    : "Reservar"}
                </button>
              </form>
            </section>
          ) : null}

          {isResidentMode ? (
            <section className="reservas-side-section">
              <div className="reservas-side-section-head">
                <h3>Mis proximas reservas</h3>
                <span>{upcomingUserReservations.length}</span>
              </div>

              <div className="reservas-day-list">
                {upcomingUserReservations.length === 0 ? (
                  <p className="reservas-empty-state">
                    Aun no tienes reservas activas para mostrar.
                  </p>
                ) : (
                  upcomingUserReservations.map((reservation) => (
                    <SelectedDayReservationItem
                      key={reservation.id}
                      reservation={reservation}
                      isResidentMode
                      isOwner
                      canCancel={canManageReservation(reservation, user?.uid, new Date())}
                      onCancel={handleCancelReservation}
                    />
                  ))
                )}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
