export default function ResidentNotificationsModal({
  isOpen,
  notifications,
  loading,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="resident-notifications-overlay" role="presentation" onClick={onClose}>
      <div
        className="resident-notifications-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resident-notifications-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="resident-notifications-header">
          <div>
            <span className="resident-notifications-kicker">Notificaciones</span>
            <h3 id="resident-notifications-title">Llegadas de correspondencia</h3>
          </div>
          <button
            type="button"
            className="resident-notifications-close"
            onClick={onClose}
            aria-label="Cerrar notificaciones"
          >
            <i className="ph-light ph-x"></i>
          </button>
        </div>

        <div className="resident-notifications-list">
          {loading ? (
            <div className="resident-notifications-empty">Cargando notificaciones...</div>
          ) : notifications.length === 0 ? (
            <div className="resident-notifications-empty">
              No tienes notificaciones de paquetes por ahora.
            </div>
          ) : (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className={`resident-notification-card${notification.read ? "" : " unread"}`}
              >
                <div className="resident-notification-card-top">
                  <span className="resident-notification-type">{notification.type}</span>
                  {!notification.read && (
                    <span className="resident-notification-pill">Nueva</span>
                  )}
                </div>
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <div className="resident-notification-meta">
                  <span>
                    {notification.torre ? `Torre ${notification.torre}` : "Torre sin dato"}
                    {" · "}
                    {notification.apartamento
                      ? `Apto ${notification.apartamento}`
                      : "Apto sin dato"}
                  </span>
                  <span>
                    {notification.dateLabel} · {notification.timeLabel}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
