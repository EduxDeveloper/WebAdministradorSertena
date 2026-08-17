# SERTENA — Panel administrador

Panel web para administrar los servicios, clientes, empleados, citas, reseñas y la configuración de las cuentas administrativas de SERTENA.

El código de la aplicación se encuentra en [`frontend`](./frontend).

## Tecnologías

- React 19 y Vite 8
- React Router
- Tailwind CSS 4
- @paper-design/shaders-react

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
cd frontend
npm install
npm run dev
```

La aplicación usa `http://localhost:4000/api` de forma predeterminada. Para cambiarla, copia `frontend/.env.example` como `frontend/.env` y configura:

```env
VITE_API_URL=https://tu-api.onrender.com/api
```

## Compilación de producción

Desde `frontend`:

```bash
npm run build
npm run preview
```

Vite deja los archivos listos para publicar en `frontend/dist/`.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Establece **Root Directory** en `frontend`.
3. Vercel detectará Vite: usa `npm run build` y el directorio de salida `dist`.
4. Añade la variable de entorno `VITE_API_URL` con la URL pública de la API de Render terminada en `/api`.
5. Vuelve a desplegar después de guardar la variable.

`frontend/vercel.json` ya configura la reescritura para las rutas internas del panel y el favicon usa el icono oficial de SERTENA.

## Integración con la API

La variable `CLIENT_ORIGINS` del servicio de Render debe contener la URL final de este panel y la del portal de clientes, separadas por comas:

```env
CLIENT_ORIGINS=https://portal-clientes.vercel.app,https://panel-admin.vercel.app
```
