import { useContext } from "react";
import AuthContext from "../context/AuthContext";

/**
 * Hook personalizado para acceder al contexto de autenticación del administrador.
 *
 * ¿Por qué existe este hook?
 * Para que los componentes no necesiten importar useContext y AuthContext por separado.
 * Simplifica el uso: const { login, user } = useAuth()
 *
 * @returns {object} El valor del AuthContext.
 */
function useAuth() {
  return useContext(AuthContext);
}

export default useAuth;
