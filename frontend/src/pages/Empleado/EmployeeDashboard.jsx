import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/ui/Sidebar";
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
    <section className="rounded-3xl border border-white/10 bg-white/[.045] p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Calendario de citas</h2>
          <p className="mt-1 text-sm text-white/45">Los puntos indican días con citas asignadas.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => moveMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[.06] text-lg font-bold transition hover:bg-white/[.12]" aria-label="Mes anterior">&lt;</button>
          <button type="button" onClick={() => moveMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[.06] text-lg font-bold transition hover:bg-white/[.12]" aria-label="Mes siguiente">&gt;</button>
        </div>
      </div>

      <h3 className="mb-4 text-center text-sm font-bold capitalize text-emerald-200">{monthLabel}</h3>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {CALENDAR_DAY_LABELS.map((day) => <span key={day} className="pb-1 text-[11px] font-bold text-white/35">{day}</span>)}
        {calendarDays.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} aria-hidden="true" />;

          const key = getDateKey(date);
          const dayAppointments = appointmentsByDate.get(key) || [];
          const isSelected = key === getDateKey(selectedDate);
          const isToday = key === todayKey;
          const hasOverdueAppointment = dayAppointments.some((item) => item.status === "Atrasado");
          const hasScheduledAppointment = dayAppointments.some((item) => item.status === "Programado" || item.status === "Pendiente");
          const dotColor = hasOverdueAppointment ? "#f87171" : (hasScheduledAppointment ? "#60a5fa" : "#4ade80");

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(date)}
              className="relative flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition hover:bg-white/[.12]"
              style={isSelected
                ? { background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", color: "#062c24" }
                : { background: isToday ? "rgba(74,222,128,.11)" : "rgba(255,255,255,.035)", border: isToday ? "1px solid rgba(74,222,128,.35)" : "1px solid transparent" }}
              aria-label={`${date.getDate()} de ${monthLabel}${dayAppointments.length ? `, ${dayAppointments.length} citas` : ""}`}
            >
              {date.getDate()}
              {dayAppointments.length > 0 && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full" style={{ background: isSelected ? "#062c24" : dotColor }} />}
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-t border-white/[.08] pt-4">
        <p className="text-sm font-bold text-white/85">{formatDate(selectedDate)}</p>
        {selectedAppointments.length ? (
          <div className="mt-3 space-y-2">
            {selectedAppointments.map((appointment) => {
              const isCompleted = appointment.status === "Finalizado";
              const isOverdue = appointment.status === "Atrasado";
              const statusColor = isCompleted ? "#4ade80" : (isOverdue ? "#f87171" : "#93c5fd");

              return (
              <div key={appointment._id} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[.08] bg-white/[.035] px-3 py-2.5 text-left">
                <span className="truncate text-sm font-semibold">{getServiceName(appointment)}</span>
                <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={{ color: statusColor, background: `${statusColor}22` }}>{appointment.status || "Programado"}</span>
              </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-white/45">No tienes citas para este día.</p>
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
    const timeoutId = window.setTimeout(() => {
      void loadAppointments();
    }, 0);
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
    <div className="relative flex min-h-screen w-full bg-[#15354d] text-white">
      <Sidebar activeTab="Inicio" />

      <main className="relative flex min-h-screen min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="mb-1 text-[15px] font-medium text-emerald-400">Hola, {user?.name || "técnico"}</p>
            <h1 className="mb-2 text-3xl font-bold leading-none tracking-tight md:text-[38px]">Mi jornada</h1>
            <p className="text-sm text-white/45">Consulta y actualiza el estado de las citas asignadas a ti.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/mis-citas")}
            className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", boxShadow: "0 4px 15px rgba(16,185,129,.28)" }}
          >
            Ver mis citas
          </button>
        </header>

        {error ? (
          <section className="rounded-3xl border border-red-400/25 bg-red-500/10 p-8 text-center">
            <p className="font-semibold text-red-200">{error}</p>
            <button type="button" onClick={loadAppointments} className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/15">Reintentar</button>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {[
                { label: "Programadas", value: summary.scheduled, accent: "#60a5fa", background: "rgba(59,130,246,.16)", icon: "P" },
                { label: "Atrasadas", value: summary.overdue, accent: "#f87171", background: "rgba(239,68,68,.15)", icon: "!" },
                { label: "Finalizadas", value: summary.completed, accent: "#4ade80", background: "rgba(34,197,94,.15)", icon: "OK" },
              ].map((card) => (
                <article key={card.label} className="min-h-[156px] rounded-3xl p-6" style={{ background: card.background, border: `1px solid ${card.accent}44` }}>
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-white/70">{card.label}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black" style={{ color: card.accent, background: `${card.accent}22` }}>{card.icon}</span>
                  </div>
                  <p className="mt-6 text-4xl font-bold" style={{ color: card.accent }}>{loading ? "-" : card.value}</p>
                  <p className="mt-1 text-xs text-white/45">Citas en tu agenda</p>
                </article>
              ))}
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
              <section className="rounded-3xl border border-white/10 bg-white/[.045] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Próximas visitas</h2>
                    <p className="mt-1 text-sm text-white/45">Las citas pendientes de completar.</p>
                  </div>
                  <button type="button" onClick={() => navigate("/mis-citas")} className="text-sm font-bold text-emerald-400 transition hover:text-emerald-300">Ver todas</button>
                </div>

                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((item) => <div key={item} className="h-20 rounded-2xl bg-white/[.07]" />)}
                  </div>
                ) : nextAppointments.length ? (
                  <div className="space-y-3">
                    {nextAppointments.map((appointment) => (
                      <button
                        type="button"
                        key={appointment._id}
                        onClick={() => navigate("/mis-citas")}
                        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/[.07] bg-white/[.035] p-4 text-left transition hover:bg-white/[.075]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold">{getServiceName(appointment)}</p>
                          <p className="mt-1 truncate text-sm text-white/50">{appointment.clientLocation || appointment.clientDirection || "Ubicación pendiente"}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-emerald-300">{formatDate(appointment.dateStart)}</p>
                          <p className="mt-1 text-xs text-white/40">{appointment.status || "Programado"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/50">
                    No tienes citas pendientes por ahora.
                  </div>
                )}
              </section>

              <AppointmentCalendar appointments={appointments} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
