import { createContext, useCallback, useEffect, useState } from "react";

// Creamos el contexto global de autenticación de administrador.
// Usar contexto evita "prop drilling" (pasar props por muchos niveles).
const AuthContext = createContext(null);

const API_URL = "http://localhost:4000/api";
const SESSION_STORAGE_KEY = "sertena:admin-auth-session";

/**
 * Lee la sesión guardada en localStorage.
 *
 * ¿Por qué existe esta función?
 * Porque al recargar la página, el estado de React se reinicia.
 * Entonces usamos localStorage para recuperar una sesión mínima.
 *
 * @returns {object|null} Objeto de sesión parseado o null si no existe/está dañado.
 */
function readStoredSession() {
  try {
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    return storedSession ? JSON.parse(storedSession) : null;
  } catch {
    // Buena práctica: si el JSON está corrupto, limpiamos la clave
    // para evitar errores repetitivos en futuros renders.
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

/**
 * Proveedor de autenticación para toda la aplicación de administrador.
 *
 * ¿Qué recibe?
 * @param {object} props
 * @param {React.ReactNode} props.children Componentes hijos que usarán el contexto.
 *
 * ¿Qué expone?
 * user, loading, isAuthenticated y funciones de auth (login, logout, recovery).
 */
export function AuthProvider({ children }) {
  // user almacena una versión mínima del admin (email).
  const [user, setUser] = useState(null);
  // loading indica si aún estamos recuperando sesión al iniciar la app.
  const [loading, setLoading] = useState(true);

  /**
   * Efecto de inicialización.
   *
   * ¿Por qué useEffect con []?
   * Porque queremos ejecutar esta lógica solo una vez al montar el provider.
   */
  useEffect(() => {
    const storedSession = readStoredSession();

    if (storedSession?.user) {
      setUser(storedSession.user);
    }

    setLoading(false);
  }, []);

  /**
   * Guarda o limpia la sesión en estado + localStorage.
   *
   * @param {object|null} nextUser Usuario a persistir o null para cerrar sesión.
   * @returns {void}
   *
   * Tip de buenas prácticas:
   * Mantener esta lógica en una sola función evita duplicación de código
   * y reduce errores al sincronizar estado con almacenamiento local.
   */
  const persistSession = useCallback((nextUser) => {
    if (!nextUser) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setUser(null);
      return;
    }

    const session = {
      user: nextUser,
      authenticatedAt: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setUser(nextUser);
  }, []);

  /**
   * Inicia sesión del administrador contra el backend.
   *
   * @param {{email: string, password: string}} credentials Credenciales del formulario.
   * @returns {Promise<{ok: boolean, message: string}>} Resultado para la UI.
   *
   * Nota:
   * - Usamos credentials: "include" para permitir envío/recepción de cookies (authAdminCookie).
   * - Devolvemos un objeto controlado (ok + message) para que la vista
   *   decida cómo mostrar feedback sin mezclar lógica de red con UI.
   */
  const login = useCallback(
    async ({ email, password }) => {
      const response = await fetch(`${API_URL}/adminLogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          ok: false,
          message: payload.message || "No se pudo iniciar sesión",
        };
      }

      persistSession({ email });

      return {
        ok: true,
        message: payload.message || "Sesión iniciada correctamente",
      };
    },
    [persistSession],
  );

  /**
   * Paso 1 de recuperación: envía código OTP al correo del admin.
   *
   * @param {{email: string}} param Email del administrador.
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  const requestRecoveryCode = useCallback(async ({ email }) => {
    const response = await fetch(`${API_URL}/adminRecovery/requestCode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        message: payload.message || "No se pudo enviar el código",
      };
    }

    return {
      ok: true,
      message: payload.message || "Código enviado al correo",
    };
  }, []);

  /**
   * Paso 2 de recuperación: verifica el código OTP ingresado.
   *
   * @param {{code: string}} param Código ingresado por el usuario.
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  const verifyRecoveryCode = useCallback(async ({ code }) => {
    const response = await fetch(`${API_URL}/adminRecovery/verifyCode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ code }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        message: payload.message || "Código inválido",
      };
    }

    return {
      ok: true,
      message: payload.message || "Código verificado correctamente",
    };
  }, []);

  /**
   * Paso 3 de recuperación: establece la nueva contraseña.
   *
   * @param {{newPassword: string, confirmNewPassword: string}} param Nuevas contraseñas.
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  const resetPassword = useCallback(async ({ newPassword, confirmNewPassword }) => {
    const response = await fetch(`${API_URL}/adminRecovery/newPassword`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ newPassword, confirmNewPassword }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        message: payload.message || "No se pudo cambiar la contraseña",
      };
    }

    return {
      ok: true,
      message: payload.message || "Contraseña actualizada correctamente",
    };
  }, []);

  /**
   * Cierra sesión en backend y frontend.
   *
   * @returns {Promise<void>}
   *
   * Tip de buenas prácticas:
   * Se usa try/finally para asegurar que la sesión local se limpie incluso
   * si la petición de logout falla (por red o servidor).
   */
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/adminLogout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      persistSession(null);
    }
  }, [persistSession]);

  /**
   * Función utilitaria para hacer peticiones al backend adjuntando
   * credenciales y parseando la respuesta JSON automáticamente.
   */
  const fetchApi = useCallback(async (endpoint, options = {}) => {
    const isFormData = options.body instanceof FormData;
    const headers = options.headers || {};
    
    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const config = {
      ...options,
      headers,
      credentials: "include",
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    let payload = null;
    try {
      const text = await response.text();
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error((payload && payload.message) || `Error ${response.status}: ${response.statusText}`);
    }

    return payload;
  }, []);

  // value reúne todo lo que otros componentes necesitan del contexto.
  // isAuthenticated se deriva del estado para no repetir esa lógica en cada vista.
  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    requestRecoveryCode,
    verifyRecoveryCode,
    resetPassword,
    clearSession: () => persistSession(null),
    apiUrl: API_URL,
    fetchApi,
  };

  // El Provider "inyecta" este valor a toda la app hija.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
export default AuthContext;
