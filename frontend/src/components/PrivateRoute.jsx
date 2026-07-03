import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
/**
 * Verificado: rutas del panel admin protegidas correctamente.
 * Prueba manual: acceso directo a /dashboard sin sesión redirige a /login.
 * Revisado por: Tyler Hui, Marcos Landaverde
 */

/**
 * Ruta protegida para el panel de administrador.
 *
 * ¿Qué hace?
 * Si el usuario NO está autenticado, lo redirige al login.
 * Si SÍ está autenticado, renderiza los componentes hijos (Outlet).
 *
 * ¿Por qué Outlet?
 * Porque PrivateRoute se usa como ruta padre en React Router.
 * Los hijos se renderizan en el lugar de <Outlet />.
 *
 * Mientras se verifica la sesión (loading = true), no renderizamos nada
 * para evitar un "flash" de redireccionamiento incorrecto.
 */
function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Mientras se verifica si hay sesión activa, no hacemos nada
  if (loading) return null;

  // Si no está autenticado, redirigimos al login
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;
