import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout, { AdminPageHeader, AdminPrimaryButton, AdminSecondaryButton, AdminStatCard, AdminStatGrid } from "../../components/ui/AdminLayout";
import useAuth from "../../hooks/useAuth";

const getId = (value) => value?._id || value;

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat("es-SV", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(date)
    : "Sin fecha asignada";
};

const getServiceName = (appointment) => appointment.idService?.nameService
  || (typeof appointment.idService === "string" ? "Servicio asignado" : "Servicio sin especificar");

const CALENDAR_DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const getDateKey = (value) => {
  const date = parseDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function AppointmentCalendar({ appointments }) {
  const todayKey = getDateKey(new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const appointmentsByDate = useMemo(() => {
    const groupedAppointments = new Map();
    appointments.forEach((appointment) => {
      const key = getDateKey(appointment.dateStart);
      if (!key) return;
      groupedAppointments.set(key, [...(groupedAppointments.get(key) || []), appointment]);
    });
    return groupedAppointments;
  }, [appointments]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const initialEmptyDays = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: initialEmptyDays }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [calendarMonth]);

  const selectedAppointments = appointmentsByDate.get(getDateKey(selectedDate)) || [];
  const monthLabel = new Intl.DateTimeFormat("es-SV", { month: "long", year: "numeric" }).format(calendarMonth);

  const moveMonth = (amount) => {
    const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + amount, 1);
    setCalendarMonth(nextMonth);
    setSelectedDate(nextMonth);
  };

  return (
    <section className="admin-card admin-card-padded">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Calendario de citas</h2>
          <p className="mt-1 text-sm admin-text-muted">Los puntos indican días con citas asignadas.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => moveMonth(-1)} className="admin-btn admin-btn-icon admin-btn-secondary" aria-label="Mes anterior">&lt;</button>
          <button type="button" onClick={() => moveMonth(1)} className="admin-btn admin-btn-icon admin-btn-secondary" aria-label="Mes siguiente">&gt;</button>
        </div>
      </div>

      <h3 className="mb-4 text-center text-sm font-bold capitalize text-teal-700">{monthLabel}</h3>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {CALENDAR_DAY_LABELS.map((day) => <span key={day} className="pb-1 text-[11px] font-bold admin-text-subtle">{day}</span>)}
        {calendarDays.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} aria-hidden="true" />;

          const key = getDateKey(date);
          const dayAppointments = appointmentsByDate.get(key) || [];
          const isSelected = key === getDateKey(selectedDate);
          const isToday = key === todayKey;
          const hasOverdueAppointment = dayAppointments.some((item) => item.status === "Atrasado");
          const hasScheduledAppointment = dayAppointments.some((item) => item.status === "Programado" || item.status === "Pendiente");
          const dotColor = hasOverdueAppointment ? "#dc2626" : (hasScheduledAppointment ? "#2563eb" : "#059669");

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(date)}
              className={`relative flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition ${isSelected ? "bg-teal-600 text-white" : isToday ? "bg-teal-50 text-teal-800 border border-teal-200" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
              aria-label={`${date.getDate()} de ${monthLabel}${dayAppointments.length ? `, ${dayAppointments.length} citas` : ""}`}
            >
              {date.getDate()}
              {dayAppointments.length > 0 && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full" style={{ background: isSelected ? "#ffffff" : dotColor }} />}
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="text-sm font-bold text-slate-900">{formatDate(selectedDate)}</p>
        {selectedAppointments.length ? (
          <div className="mt-3 space-y-2">
            {selectedAppointments.map((appointment) => {
              const isCompleted = appointment.status === "Finalizado";
              const isOverdue = appointment.status === "Atrasado";
              const badgeClass = isCompleted ? "admin-badge--green" : (isOverdue ? "admin-badge--red" : "admin-badge--blue");
              return (
                <div key={appointment._id} className="admin-list-item items-center justify-between">
                  <span className="truncate text-sm font-semibold text-slate-900">{getServiceName(appointment)}</span>
                  <span className={`admin-badge shrink-0 ${badgeClass}`}>{appointment.status || "Programado"}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm admin-text-muted">No tienes citas para este día.</p>
        )}
      </div>
    </section>
  );
}

export default function EmployeeDashboard() {
  const { fetchApi, user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchApi("/proyects");
      const employeeAppointments = (Array.isArray(data) ? data : [])
        .filter((appointment) => String(getId(appointment.idEmpleado)) === String(user?.employeeId))
        .sort((a, b) => (parseDate(a.dateStart)?.getTime() || 0) - (parseDate(b.dateStart)?.getTime() || 0));
      setAppointments(employeeAppointments);
    } catch (requestError) {
      setError(requestError.message || "No pudimos cargar tus citas.");
    } finally {
      setLoading(false);
    }
  }, [fetchApi, user?.employeeId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadAppointments(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAppointments]);

  const summary = useMemo(() => {
    const scheduled = appointments.filter((item) => item.status === "Programado").length;
    const overdue = appointments.filter((item) => item.status === "Atrasado").length;
    const completed = appointments.filter((item) => item.status === "Finalizado").length;
    return { scheduled, overdue, completed };
  }, [appointments]);

  const nextAppointments = useMemo(
    () => appointments.filter((item) => item.status !== "Finalizado").slice(0, 4),
    [appointments],
  );

  return (
    <AdminLayout activeTab="Inicio">
      <AdminPageHeader
        eyebrow={`Hola, ${user?.name || "técnico"}`}
        title="Mi jornada"
        description="Consulta y actualiza el estado de las citas asignadas a ti."
        action={
          <AdminPrimaryButton type="button" onClick={() => navigate("/mis-citas")}>
            Ver mis citas
          </AdminPrimaryButton>
        }
      />

      {error ? (
        <section className="admin-card admin-card-padded border-red-200 bg-red-50 text-center">
          <p className="font-semibold text-red-700">{error}</p>
          <AdminSecondaryButton type="button" onClick={loadAppointments} className="mt-4">Reintentar</AdminSecondaryButton>
        </section>
      ) : (
        <>
          <AdminStatGrid columns={3}>
            {[
              { label: "Programadas", value: loading ? "-" : summary.scheduled, iconTone: "blue", stroke: "#3b82f6" },
              { label: "Atrasadas", value: loading ? "-" : summary.overdue, iconTone: "red", stroke: "#ef4444" },
              { label: "Finalizadas", value: loading ? "-" : summary.completed, iconTone: "green", stroke: "#10b981" },
            ].map((card) => (
              <AdminStatCard
                key={card.label}
                label={card.label}
                value={card.value}
                iconTone={card.iconTone}
                footer="Citas en tu agenda"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={card.stroke} strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
              />
            ))}
          </AdminStatGrid>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
            <section className="admin-card admin-card-padded">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Próximas visitas</h2>
                  <p className="mt-1 text-sm admin-text-muted">Las citas pendientes de completar.</p>
                </div>
                <button type="button" onClick={() => navigate("/mis-citas")} className="text-sm font-bold text-teal-700 hover:text-teal-800">Ver todas</button>
              </div>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((item) => <div key={item} className="h-20 rounded-lg bg-slate-100" />)}
                </div>
              ) : nextAppointments.length ? (
                <div className="space-y-3">
                  {nextAppointments.map((appointment) => (
                    <button type="button" key={appointment._id} onClick={() => navigate("/mis-citas")} className="admin-list-item w-full items-center justify-between text-left">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{getServiceName(appointment)}</p>
                        <p className="mt-1 truncate text-sm admin-text-muted">{appointment.clientLocation || appointment.clientDirection || "Ubicación pendiente"}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-teal-700">{formatDate(appointment.dateStart)}</p>
                        <p className="mt-1 text-xs admin-text-subtle">{appointment.status || "Programado"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="admin-empty border border-dashed border-slate-300 rounded-lg py-10">No tienes citas pendientes por ahora.</div>
              )}
            </section>

            <AppointmentCalendar appointments={appointments} />
          </div>
        </>
      )}
    </AdminLayout>
  );
}
