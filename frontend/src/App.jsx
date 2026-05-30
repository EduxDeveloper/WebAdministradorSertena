// Importamos las herramientas de enrutamiento de React Router
// BrowserRouter envuelve toda la app para habilitar la navegacion
// Routes y Route definen las paginas disponibles
// Navigate permite redirigir al usuario automaticamente
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Importamos cada una de las paginas de la aplicacion
import Login from './pages/Login/Login'
import RecoveryEmail from './pages/RecoveryEmail/RecoveryEmail'
import VerifyCode from './pages/VerifyCode/VerifyCode'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import Dashboard from './pages/Dashboard/Dashboard'

// Componente principal de la aplicacion
// Aqui se definen todas las rutas y a que pagina corresponde cada URL
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta del login, es la pantalla principal de inicio de sesion */}
        <Route path="/login" element={<Login />} />

        {/* Ruta para recuperar contraseña, el usuario ingresa su correo */}
        <Route path="/recovery-email" element={<RecoveryEmail />} />

        {/* Ruta para verificar el codigo de 5 digitos que se envia por correo */}
        <Route path="/verify-code" element={<VerifyCode />} />

        {/* Ruta para restablecer la contraseña despues de verificar el codigo */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Ruta del dashboard principal, el panel de administracion */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Si el usuario pone cualquier otra URL, lo mandamos al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

// Exportamos el componente para que main.jsx lo pueda usar
export default App
