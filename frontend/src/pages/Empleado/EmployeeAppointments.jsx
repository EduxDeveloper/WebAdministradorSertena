import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout, { AdminPageHeader, AdminPrimaryButton, AdminSecondaryButton } from "../../components/ui/AdminLayout";
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
    <AdminLayout activeTab="Mis citas">
      <AdminPageHeader
        eyebrow={`Agenda de ${user?.name || "empleado"}`}
        title="Mis citas"
        description="Solo se muestran las citas que tienes asignadas. Puedes actualizar su estado y registrar observaciones."
      />

      <div className="admin-tabs flex-wrap">
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => selectFilter(status)}
            className={`admin-tab ${filter === status ? "admin-tab--active" : ""}`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <div className="admin-card admin-card-padded border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((item) => <div key={item} className="h-52 rounded-lg bg-slate-100" />)}
        </div>
      ) : filteredAppointments.length ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-1 px-1 text-sm admin-text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>Mostrando {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, filteredAppointments.length)} de {filteredAppointments.length} citas</p>
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
              <article key={appointment._id} className="admin-card overflow-hidden">
                <div className="admin-card-padded">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="admin-badge" style={{ color: style.color, background: style.background }}>{appointment.status || "Programado"}</span>
                        <span className="text-sm admin-text-muted">{formatDate(appointment.dateStart)}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{serviceName}</h2>
                      <p className="mt-1 text-sm admin-text-muted">Cliente: {clientName}</p>
                      <p className="mt-3 text-sm admin-text-muted">{appointment.clientLocation || appointment.clientDirection || "Ubicación no especificada"}</p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:w-[310px] lg:flex-col">
                      <select
                        value={appointment.status || "Programado"}
                        disabled={isSaving}
                        onChange={(event) => updateStatus(appointment, event.target.value)}
                        className="admin-input min-h-11 font-semibold disabled:cursor-wait disabled:opacity-60"
                        aria-label={`Estado de ${serviceName}`}
                      >
                        <option value="Programado">Programado</option>
                        <option value="Atrasado">Atrasado</option>
                        <option value="Finalizado">Finalizado</option>
                      </select>
                      <AdminSecondaryButton type="button" onClick={() => setExpandedId(isExpanded ? null : appointment._id)} className="min-h-11 justify-center">
                        {isExpanded ? "Ocultar detalle" : "Ver detalle"}
                      </AdminSecondaryButton>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="admin-card admin-card-padded">
                        <h3 className="font-bold text-slate-900">Contacto y ubicación</h3>
                        <p className="mt-3 text-sm admin-text-muted">{appointment.clientDirection || "Dirección no especificada"}</p>
                        <p className="mt-2 text-sm admin-text-muted">{appointment.clientPhone || "Teléfono no especificado"}</p>
                        {(mapUrl || wazeUrl) && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="admin-btn admin-btn-secondary text-xs px-3 py-2">Google Maps</a>}
                            {wazeUrl && <a href={wazeUrl} target="_blank" rel="noreferrer" className="admin-btn admin-btn-primary text-xs px-3 py-2">Waze</a>}
                          </div>
                        )}
                      </div>
                      <div className="admin-card admin-card-padded">
                        <h3 className="font-bold text-slate-900">Descripción del servicio</h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 admin-text-muted">{appointment.description || "Sin descripción adicional."}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <label htmlFor={`notes-${appointment._id}`} className="block text-sm font-bold text-emerald-900">Observaciones de finalización</label>
                      <p className="mt-1 text-xs admin-text-muted">Son obligatorias cuando cambies el estado a "Finalizado".</p>
                      <textarea
                        id={`notes-${appointment._id}`}
                        value={notes[appointment._id] || ""}
                        onChange={(event) => setNotes((current) => ({ ...current, [appointment._id]: event.target.value }))}
                        placeholder="Describe el trabajo realizado, incidencias o recomendaciones."
                        className="admin-input mt-3 min-h-24 resize-y"
                      />
                      {appointment.status === "Finalizado" && <p className="mt-2 text-xs text-emerald-800">Cita finalizada. Puedes conservar estas observaciones como registro.</p>}
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-2 pt-3" aria-label="Paginación de citas">
              <AdminSecondaryButton type="button" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Anterior</AdminSecondaryButton>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`admin-btn min-w-10 justify-center ${pageNumber === currentPage ? "admin-btn-primary" : "admin-btn-secondary"}`}
                >
                  {pageNumber}
                </button>
              ))}
              <AdminSecondaryButton type="button" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(current + 1, totalPages))}>Siguiente</AdminSecondaryButton>
            </nav>
          )}
        </section>
      ) : (
        <section className="admin-card admin-card-padded border border-dashed border-slate-300 text-center">
          <h2 className="text-lg font-bold text-slate-900">No hay citas en esta vista</h2>
          <p className="mt-2 text-sm admin-text-muted">Cuando se te asigne una cita, aparecerá aquí.</p>
        </section>
      )}
    </AdminLayout>
  );
}
