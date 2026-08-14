import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/ui/Sidebar";
import useAuth from "../../hooks/useAuth";

const STATUSES = ["Todos", "Atrasado", "Programado", "Finalizado"];
const STATUS_ORDER = { Atrasado: 0, Programado: 1, Finalizado: 2 };
const PAGE_SIZE = 6;
const getId = (value) => value?._id || value;

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("es-SV", { day: "numeric", month: "long", year: "numeric" }).format(date) : "Sin fecha";
};

const normalizedStatus = (appointment) => appointment.status === "Pendiente"
  ? "Programado"
  : (appointment.status || "Programado");

const sortAppointmentsByStatus = (items) => [...items].sort((first, second) => {
  const statusDifference = (STATUS_ORDER[normalizedStatus(first)] ?? 99) - (STATUS_ORDER[normalizedStatus(second)] ?? 99);
  if (statusDifference !== 0) return statusDifference;

  return (parseDate(first.dateStart)?.getTime() || 0) - (parseDate(second.dateStart)?.getTime() || 0);
});

const statusStyle = (status) => {
  if (status === "Finalizado") return { color: "#4ade80", background: "rgba(34,197,94,.14)" };
  if (status === "Atrasado") return { color: "#f87171", background: "rgba(239,68,68,.14)" };
  return { color: "#93c5fd", background: "rgba(59,130,246,.15)" };
};

const mapUrlFor = (appointment) => {
  const { latitude, longitude } = appointment.clientCoordinates || {};
  if (latitude !== undefined && longitude !== undefined) return `https://www.google.com/maps?q=${latitude},${longitude}`;
  return appointment.clientMapUrl || "";
};

const wazeUrlFor = (appointment) => {
  const { latitude, longitude } = appointment.clientCoordinates || {};
  if (latitude === undefined || longitude === undefined) return "";
  return `https://www.waze.com/ul?ll=${latitude}%2C${longitude}&navigate=yes`;
};

export default function EmployeeAppointments() {
  const { fetchApi, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [page, setPage] = useState(1);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchApi("/proyects");
      const employeeAppointments = sortAppointmentsByStatus(
        (Array.isArray(data) ? data : [])
          .filter((appointment) => String(getId(appointment.idEmpleado)) === String(user?.employeeId)),
      );
      setAppointments(employeeAppointments);
      setNotes(Object.fromEntries(employeeAppointments.map((item) => [item._id, item.completionNotes || ""])));
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

  const filteredAppointments = useMemo(
    () => filter === "Todos" ? appointments : appointments.filter((item) => normalizedStatus(item) === filter),
    [appointments, filter],
  );

  const totalPages = Math.max(Math.ceil(filteredAppointments.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const paginatedAppointments = useMemo(
    () => filteredAppointments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredAppointments],
  );

  const selectFilter = (status) => {
    setFilter(status);
    setPage(1);
    setExpandedId(null);
  };

  const updateStatus = async (appointment, nextStatus) => {
    const isCompleted = nextStatus === "Finalizado";
    const completionNotes = String(notes[appointment._id] || "").trim();
    if (isCompleted && !completionNotes) {
      setExpandedId(appointment._id);
      setError("Agrega las observaciones antes de finalizar una cita.");
      return;
    }

    setSavingId(appointment._id);
    setError("");
    try {
      await fetchApi(`/proyects/${appointment._id}`, {
        method: "PUT",
        body: JSON.stringify({
          idService: getId(appointment.idService),
          idCustomer: getId(appointment.idCustomer),
          idEmpleado: getId(appointment.idEmpleado),
          dateStart: appointment.dateStart,
          dateEnd: appointment.dateEnd,
          clientPhone: appointment.clientPhone || "",
          clientDirection: appointment.clientDirection || "",
          clientLocation: appointment.clientLocation || "",
          clientCoordinates: appointment.clientCoordinates,
          clientMapUrl: appointment.clientMapUrl || "",
          finalPrice: appointment.finalPrice || "0",
          status: nextStatus,
          isCompleted,
          completionNotes: isCompleted ? completionNotes : "",
          description: appointment.description || "",
        }),
      });
      await loadAppointments();
    } catch (requestError) {
      setError(requestError.message || "No se pudo actualizar el estado de la cita.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full bg-[#15354d] text-white">
      <Sidebar activeTab="Mis citas" />

      <main className="relative flex min-h-screen min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <header>
          <p className="mb-1 text-[15px] font-medium text-emerald-400">Agenda de {user?.name || "empleado"}</p>
          <h1 className="mb-2 text-3xl font-bold leading-none tracking-tight md:text-[38px]">Mis citas</h1>
          <p className="text-sm text-white/45">Solo se muestran las citas que tienes asignadas. Puedes actualizar su estado y registrar observaciones.</p>
        </header>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => selectFilter(status)}
              className="rounded-xl px-4 py-2 text-sm font-bold transition"
              style={filter === status
                ? { background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", color: "#062c24" }
                : { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.68)", border: "1px solid rgba(255,255,255,.09)" }}
            >
              {status}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((item) => <div key={item} className="h-52 rounded-3xl bg-white/[.07]" />)}
          </div>
        ) : filteredAppointments.length ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-1 px-1 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Mostrando {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, filteredAppointments.length)} de {filteredAppointments.length} citas
              </p>
              <p>Orden: atrasadas, programadas y finalizadas.</p>
            </div>

            {paginatedAppointments.map((appointment) => {
              const isExpanded = expandedId === appointment._id;
              const style = statusStyle(appointment.status);
              const serviceName = appointment.idService?.nameService || "Servicio asignado";
              const clientName = appointment.idCustomer?.nombre || "Cliente";
              const mapUrl = mapUrlFor(appointment);
              const wazeUrl = wazeUrlFor(appointment);
              const isSaving = savingId === appointment._id;

              return (
                <article key={appointment._id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.045] shadow-xl backdrop-blur-xl">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full px-3 py-1 text-xs font-bold" style={style}>{appointment.status || "Programado"}</span>
                          <span className="text-sm text-white/45">{formatDate(appointment.dateStart)}</span>
                        </div>
                        <h2 className="text-xl font-bold">{serviceName}</h2>
                        <p className="mt-1 text-sm text-white/65">Cliente: {clientName}</p>
                        <p className="mt-3 text-sm text-white/50">{appointment.clientLocation || appointment.clientDirection || "Ubicación no especificada"}</p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row lg:w-[310px] lg:flex-col">
                        <select
                          value={appointment.status || "Programado"}
                          disabled={isSaving}
                          onChange={(event) => updateStatus(appointment, event.target.value)}
                          className="min-h-11 rounded-xl px-3 text-sm font-bold outline-none disabled:cursor-wait disabled:opacity-60"
                          style={{ color: "#e5e7eb", background: "rgba(0,26,26,.75)", border: "1px solid rgba(74,222,128,.3)" }}
                          aria-label={`Estado de ${serviceName}`}
                        >
                          <option value="Programado">Programado</option>
                          <option value="Atrasado">Atrasado</option>
                          <option value="Finalizado">Finalizado</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : appointment._id)}
                          className="min-h-11 rounded-xl border border-white/10 bg-white/[.06] px-4 text-sm font-bold transition hover:bg-white/[.11]"
                        >
                          {isExpanded ? "Ocultar detalle" : "Ver detalle"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/[.08] bg-black/[.12] p-5 sm:p-6">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/[.08] bg-white/[.04] p-4">
                          <h3 className="font-bold">Contacto y ubicación</h3>
                          <p className="mt-3 text-sm text-white/60">{appointment.clientDirection || "Dirección no especificada"}</p>
                          <p className="mt-2 text-sm text-white/60">{appointment.clientPhone || "Teléfono no especificado"}</p>
                          {(mapUrl || wazeUrl) && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-lg bg-[#003366] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#002244]">Google Maps</a>}
                              {wazeUrl && <a href={wazeUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-600">Waze</a>}
                            </div>
                          )}
                        </div>
                        <div className="rounded-2xl border border-white/[.08] bg-white/[.04] p-4">
                          <h3 className="font-bold">Descripción del servicio</h3>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">{appointment.description || "Sin descripción adicional."}</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[.07] p-4">
                        <label htmlFor={`notes-${appointment._id}`} className="block text-sm font-bold text-emerald-100">Observaciones de finalización</label>
                        <p className="mt-1 text-xs text-white/50">Son obligatorias cuando cambies el estado a "Finalizado".</p>
                        <textarea
                          id={`notes-${appointment._id}`}
                          value={notes[appointment._id] || ""}
                          onChange={(event) => setNotes((current) => ({ ...current, [appointment._id]: event.target.value }))}
                          placeholder="Describe el trabajo realizado, incidencias o recomendaciones."
                          className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none transition focus:border-emerald-400/60"
                        />
                        {appointment.status === "Finalizado" && <p className="mt-2 text-xs text-emerald-200">Cita finalizada. Puedes conservar estas observaciones como registro.</p>}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {totalPages > 1 && (
              <nav className="flex flex-wrap items-center justify-center gap-2 pt-3" aria-label="Paginación de citas">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  className="rounded-xl border border-white/10 bg-white/[.06] px-4 py-2 text-sm font-bold transition hover:bg-white/[.11] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className="h-10 min-w-10 rounded-xl px-3 text-sm font-bold transition"
                    style={pageNumber === currentPage
                      ? { background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", color: "#062c24" }
                      : { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.75)" }}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  className="rounded-xl border border-white/10 bg-white/[.06] px-4 py-2 text-sm font-bold transition hover:bg-white/[.11] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Siguiente
                </button>
              </nav>
            )}
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[.03] p-12 text-center">
            <h2 className="text-lg font-bold">No hay citas en esta vista</h2>
            <p className="mt-2 text-sm text-white/50">Cuando se te asigne una cita, aparecerá aquí.</p>
          </section>
        )}
      </main>
    </div>
  );
}
