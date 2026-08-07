import { Link, Navigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"

function StatusLayout({ code, title, description, actionTo, actionLabel }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-5 text-white">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
      <section className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
        <p className="text-7xl font-black tracking-tight text-cyan-300 sm:text-8xl">{code}</p>
        <h1 className="mt-5 text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/65 sm:text-base">{description}</p>
        <Link to={actionTo} className="mt-8 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
          {actionLabel}
        </Link>
      </section>
    </main>
  )
}

export function ForbiddenPage() {
  return (
    <StatusLayout
      code="403"
      title="Acceso no autorizado"
      description="Necesitas iniciar sesión para acceder a esta sección del panel administrativo."
      actionTo="/login"
      actionLabel="Ir al inicio de sesión"
    />
  )
}

export function ActiveSessionPage({ destination = "/dashboard", actionLabel = "Ir al dashboard" }) {
  return (
    <StatusLayout
      code="403"
      title="Ya tienes una sesión iniciada"
      description="No puedes acceder al inicio de sesión mientras tu sesión actual esté activa."
      actionTo={destination}
      actionLabel={actionLabel}
    />
  )
}

export function AdminUnknownRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
}
