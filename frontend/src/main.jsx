// Importamos StrictMode de React para detectar problemas potenciales en desarrollo
import { StrictMode } from 'react'
// Importamos createRoot que es la forma moderna de montar la app en React 18+
import { createRoot } from 'react-dom/client'
// Importamos los estilos globales de toda la aplicacion
import './index.css'
// Importamos el componente principal App que contiene todas las rutas
import App from './App.jsx'

// Buscamos el elemento con id "root" en el HTML y montamos toda la aplicacion ahi
// StrictMode nos ayuda a encontrar errores durante el desarrollo, no afecta en produccion
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
