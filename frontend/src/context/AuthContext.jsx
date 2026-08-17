import { createContext, useCallback, useState } from "react";
import API_URL from "../config/api";

const AuthContext = createContext(null);

const SESSION_STORAGE_KEY = "sertena:auth-session";
const LEGACY_SESSION_STORAGE_KEY = "sertena:admin-auth-session";
const RECOVERY_ROLE_STORAGE_KEY = "sertena:recovery-role";

function readStoredSession() {
  try {
    const currentSession = localStorage.getItem(SESSION_STORAGE_KEY);
    const legacySession = localStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
    const storedSession = currentSession || legacySession;
    const parsedSession = storedSession ? JSON.parse(storedSession) : null;

    if (!parsedSession?.user) return null;

    // Las sesiones anteriores al soporte de empleados eran siempre de administrador.
    return {
      ...parsedSession,
      user: { ...parsedSession.user, role: parsedSession.user.role || "admin" },
    };
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    return null;
  }
}

async function requestApi(path, options = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
    });
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  } catch (error) {
    return { error };
  }
}

function getErrorMessage(result, fallback) {
  if (result?.error) return "No se pudo conectar con el servidor";
  return result?.payload?.message || fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredSession()?.user || null);
  const loading = false;

  const persistSession = useCallback((nextUser) => {
    if (!nextUser) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      setUser(null);
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      user: nextUser,
      authenticatedAt: new Date().toISOString(),
    }));
    localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    setUser(nextUser);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const adminResult = await requestApi("/adminLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    if (adminResult.response?.ok) {
      persistSession({ email: normalizedEmail, role: "admin" });
      return { ok: true, role: "admin", message: adminResult.payload.message || "Sesión iniciada correctamente" };
    }

    // Solo se intenta el login de empleado cuando el backend confirma que el correo
    // no pertenece a un administrador. Una contraseña incorrecta de admin no debe
    // probarse contra otro tipo de cuenta.
    const adminNotFound = adminResult.response?.status === 400
      && adminResult.payload?.message === "Admin not found";

    if (!adminNotFound) {
      return { ok: false, message: getErrorMessage(adminResult, "No se pudo iniciar sesión") };
    }

    const employeeResult = await requestApi("/loginEmpleado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    if (!employeeResult.response?.ok) {
      return { ok: false, message: getErrorMessage(employeeResult, "No se pudo iniciar sesión") };
    }

    // El endpoint de login de empleado no devuelve su id. Se consulta el recurso
    // existente de empleados una vez para poder filtrar sus citas por idEmpleado.
    const employeesResult = await requestApi("/empleados/obtener");
    const employee = Array.isArray(employeesResult.payload)
      ? employeesResult.payload.find((item) => String(item.email || "").toLowerCase() === normalizedEmail)
      : null;

    if (!employee?._id) {
      await requestApi("/logoutEmpleado", { method: "POST" });
      return { ok: false, message: "No fue posible identificar el perfil del empleado" };
    }

    const name = [employee.nombre || employee.name, employee.apellido || employee.lastName]
      .filter(Boolean)
      .join(" ");

    persistSession({
      email: normalizedEmail,
      role: "employee",
      employeeId: employee._id,
      name: name || normalizedEmail,
    });

    return { ok: true, role: "employee", message: employeeResult.payload.message || "Sesión iniciada correctamente" };
  }, [persistSession]);

  const requestRecoveryCode = useCallback(async ({ email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    sessionStorage.removeItem(RECOVERY_ROLE_STORAGE_KEY);
    const adminResult = await requestApi("/adminRecovery/requestCode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    if (adminResult.response?.ok) {
      sessionStorage.setItem(RECOVERY_ROLE_STORAGE_KEY, "admin");
      return { ok: true, message: adminResult.payload.message || "Código enviado al correo" };
    }

    const adminNotFound = adminResult.response?.status === 404
      && adminResult.payload?.message === "Admin not found";
    if (!adminNotFound) {
      return { ok: false, message: getErrorMessage(adminResult, "No se pudo enviar el código") };
    }

    const employeeResult = await requestApi("/empleadoRecovery/requestCode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    if (!employeeResult.response?.ok) {
      return { ok: false, message: getErrorMessage(employeeResult, "No se pudo enviar el código") };
    }

    sessionStorage.setItem(RECOVERY_ROLE_STORAGE_KEY, "employee");
    return { ok: true, message: employeeResult.payload.message || "Código enviado al correo" };
  }, []);

  const recoveryRequest = useCallback(async (action, body, fallback) => {
    const role = sessionStorage.getItem(RECOVERY_ROLE_STORAGE_KEY);
    if (!role) return { ok: false, message: "Solicita un nuevo código de recuperación" };

    const basePath = role === "employee" ? "/empleadoRecovery" : "/adminRecovery";
    const result = await requestApi(`${basePath}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!result.response?.ok) return { ok: false, message: getErrorMessage(result, fallback) };
    return { ok: true, message: result.payload.message || "Operación realizada correctamente" };
  }, []);

  const verifyRecoveryCode = useCallback(
    ({ code }) => recoveryRequest("verifyCode", { code }, "Código inválido"),
    [recoveryRequest],
  );

  const resetPassword = useCallback(async ({ newPassword, confirmNewPassword }) => {
    const result = await recoveryRequest(
      "newPassword",
      { newPassword, confirmNewPassword },
      "No se pudo cambiar la contraseña",
    );

    if (result.ok) sessionStorage.removeItem(RECOVERY_ROLE_STORAGE_KEY);
    return result;
  }, [recoveryRequest]);

  const logout = useCallback(async () => {
    const endpoint = user?.role === "employee" ? "/logoutEmpleado" : "/adminLogout";
    try {
      await requestApi(endpoint, { method: "POST" });
    } finally {
      persistSession(null);
    }
  }, [persistSession, user?.role]);

  const updateUser = useCallback((changes) => {
    persistSession({ ...(user || {}), ...changes });
  }, [persistSession, user]);

  const fetchApi = useCallback(async (endpoint, options = {}) => {
    const isFormData = options.body instanceof FormData;
    const headers = { ...(options.headers || {}) };
    if (!isFormData && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.message || `Error ${response.status}: ${response.statusText}`);
    }
    return payload;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isEmployee: user?.role === "employee",
    login,
    logout,
    updateUser,
    requestRecoveryCode,
    verifyRecoveryCode,
    resetPassword,
    clearSession: () => persistSession(null),
    apiUrl: API_URL,
    fetchApi,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
export default AuthContext;
