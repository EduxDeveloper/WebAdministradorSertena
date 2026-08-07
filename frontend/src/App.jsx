// Importamos las herramientas de enrutamiento de React Router
// BrowserRouter envuelve toda la app para habilitar la navegacion
// Routes y Route definen las paginas disponibles
// Navigate permite redirigir al usuario automaticamente
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Importamos cada una de las paginas de la aplicacion
import Login from './pages/Login/Login'
import RecoveryEmail from './pages/RecoveryEmail/RecoveryEmail'
import VerifyCode from './pages/VerifyCode/VerifyCode'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import Dashboard from './pages/Dashboard/Dashboard'
import Servicios from './pages/Servicios/Servicios'
import Clientes from './pages/Clientes/Clientes'
import Empleados from './pages/Empleados/Empleados'
import Resenias from './pages/Resenias/Resenias'
import ProximasCitas from './pages/ProximasCitas/ProximasCitas'
import Configuracion from './pages/Configuracion/Configuracion'
import { AdminUnknownRoute } from './components/RouteFeedback'

// Ruta protegida: solo deja pasar si el admin esta autenticado
import PrivateRoute from './components/PrivateRoute'

// Componente principal de la aplicacion
// Aqui se definen todas las rutas y a que pagina corresponde cada URL
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas publicas: login y recuperacion de contraseña */}
        <Route path="/login" element={<Login />} />
        <Route path="/recovery-email" element={<RecoveryEmail />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rutas privadas: solo accesibles si el admin inicio sesion */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/empleados" element={<Empleados />} />
          <Route path="/resenias" element={<Resenias />} />
          <Route path="/proximas-citas" element={<ProximasCitas />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>

        {/* Si el usuario pone cualquier otra URL, lo mandamos al login */}
        <Route path="*" element={<AdminUnknownRoute />} />
      </Routes>
    </BrowserRouter>
  )
}

// Exportamos el componente para que main.jsx lo pueda usar
export default App
