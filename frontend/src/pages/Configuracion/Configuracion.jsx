import { useEffect, useState } from "react"
import Sidebar from "../../components/ui/Sidebar"
import useAuth from "../../hooks/useAuth"

const passwordIsStrong = (password) => password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password)
const emailIsValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function Configuracion() {
  const { fetchApi, updateUser } = useAuth()
  const [profile, setProfile] = useState({ name: "", lastName: "", email: "", status: false, timeOut: null })
  const [originalEmail, setOriginalEmail] = useState("")
  const [profileLoading, setProfileLoading] = useState(true)
  const [currentCode, setCurrentCode] = useState("")
  const [newEmailCode, setNewEmailCode] = useState("")
  const [emailStep, setEmailStep] = useState("idle")
  const [passwordCode, setPasswordCode] = useState("")
  const [passwordStep, setPasswordStep] = useState("idle")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState("")
  const [message, setMessage] = useState({ type: "", text: "" })

  const notify = (type, text) => setMessage({ type, text })
  const setBusy = (value) => { setLoading(value); setMessage({ type: "", text: "" }) }
  const sixDigits = (value) => value.replace(/\D/g, "").slice(0, 6)
  const changingEmail = profile.email.trim().toLowerCase() !== originalEmail.toLowerCase()

  useEffect(() => {
    let active = true
    const loadProfile = async () => {
      try {
        const result = await fetchApi("/adminSettings/profile")
        if (!active) return
        setProfile(result.data)
        setOriginalEmail(result.data.email || "")
      } catch (error) {
        if (active) notify("error", error.message)
      } finally {
        if (active) setProfileLoading(false)
      }
    }
    loadProfile()
    return () => { active = false }
  }, [fetchApi])

  const requestCurrentEmailCode = async () => {
    if (!emailIsValid(profile.email)) return notify("error", "Ingresa un correo nuevo válido.")
    setBusy("current-email")
    try {
      const result = await fetchApi("/adminSettings/profile/request-current-email-code", { method: "POST" })
      setEmailStep("current-sent")
      setCurrentCode("")
      notify("success", result.message)
    } catch (error) { notify("error", error.message) } finally { setLoading("") }
  }

  const verifyCurrentEmailCode = async () => {
    if (!/^\d{6}$/.test(currentCode)) return notify("error", "Ingresa los 6 dígitos enviados al correo actual.")
    setBusy("verify-current-email")
    try {
      const result = await fetchApi("/adminSettings/profile/verify-current-email-code", { method: "POST", body: JSON.stringify({ code: currentCode }) })
      setEmailStep("current-verified")
      notify("success", result.message)
    } catch (error) { notify("error", error.message) } finally { setLoading("") }
  }

  const requestNewEmailCode = async () => {
    setBusy("new-email")
    try {
      const result = await fetchApi("/adminSettings/profile/request-new-email-code", { method: "POST", body: JSON.stringify({ newEmail: profile.email.trim().toLowerCase() }) })
      setEmailStep("new-sent")
      setNewEmailCode("")
      notify("success", result.message)
    } catch (error) { notify("error", error.message) } finally { setLoading("") }
  }

  const verifyNewEmailCode = async () => {
    if (!/^\d{6}$/.test(newEmailCode)) return notify("error", "Ingresa los 6 dígitos enviados al correo nuevo.")
    setBusy("verify-new-email")
    try {
      const result = await fetchApi("/adminSettings/profile/verify-new-email-code", { method: "POST", body: JSON.stringify({ code: newEmailCode }) })
      setEmailStep("new-verified")
      notify("success", result.message)
    } catch (error) { notify("error", error.message) } finally { setLoading("") }
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    if (profile.name.trim().length < 2 || profile.lastName.trim().length < 2 || !emailIsValid(profile.email)) return notify("error", "Nombre, apellido y correo válido son obligatorios.")
    if (changingEmail && emailStep !== "new-verified") return notify("error", "Completa las verificaciones de ambos correos antes de guardar.")
    setBusy("profile")
    try {
      const result = await fetchApi("/adminSettings/profile", { method: "PUT", body: JSON.stringify({ name: profile.name, lastName: profile.lastName, email: profile.email.trim().toLowerCase() }) })
      setProfile((previous) => ({ ...previous, ...result.data }))
      setOriginalEmail(result.data.email)
      setEmailStep("idle")
      setCurrentCode("")
      setNewEmailCode("")
      updateUser({ email: result.data.email, name: result.data.name, lastName: result.data.lastName })
      notify("success", result.message)
    } catch (error) { notify("error", error.message) } finally { setLoading("") }
  }

  const requestPasswordCode = async () => {
    setBusy("password-code")
    try {
      const result = await fetchApi("/adminSettings/request-password-code", { method: "POST" })
      setPasswordStep("sent")
      setPasswordCode("")
      notify("success", result.message)
    } catch (error) { notify("error", error.message) } finally { setLoading("") }
  }

  const verifyPasswordCode = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(passwordCode)) return notify("error", "Ingresa los 6 dígitos del código.")
    setBusy("verify-password-code")
    try {
      const result = await fetchApi("/adminSettings/verify-password-code", { method: "POST", body: JSON.stringify({ code: passwordCode }) })
      setPasswordStep("verified")
      notify("success", result.message)
    } catch (error) { notify("error", error.message) } finally { setLoading("") }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    if (!passwordIsStrong(newPassword)) return notify("error", "La contraseña debe tener al menos 8 caracteres e incluir letras y números.")
    if (newPassword !== confirmPassword) return notify("error", "Las contraseñas no coinciden.")
    setBusy("password")
    try {
      const result = await fetchApi("/adminSettings/change-password", { method: "POST", body: JSON.stringify({ newPassword, confirmNewPassword: confirmPassword }) })
      setNewPassword("")
      setConfirmPassword("")
      setPasswordCode("")
      setPasswordStep("idle")
      notify("success", result.message)
    } catch (error) { notify("error", error.message) } finally { setLoading("") }
  }

  const updateProfileField = (field, value) => {
    setProfile((previous) => ({ ...previous, [field]: value }))
    if (field === "email") {
      setEmailStep("idle")
      setCurrentCode("")
      setNewEmailCode("")
    }
  }

  return (
    <div className="min-h-screen flex text-white" style={{ background: "linear-gradient(135deg, #001a1a 0%, #002b2b 50%, #001a1a 100%)" }}>
      <Sidebar activeTab="Configuración" />
      <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10"><div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">Cuenta administrativa</p><h1 className="mt-2 text-3xl font-bold">Configuración de seguridad</h1><p className="mt-2 text-white/60">Actualiza tu perfil y protege los cambios sensibles mediante códigos de verificación.</p>
        {message.text && <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${message.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}>{message.text}</div>}

        <section className="mt-8 rounded-2xl border border-white/10 p-5 sm:p-7" style={{ background: "rgba(255,255,255,0.05)" }}>
          <h2 className="text-xl font-bold">Datos del administrador</h2><p className="mt-1 text-sm text-white/55">Nombre y apellido se actualizan al guardar. El correo requiere doble verificación.</p>
          {profileLoading ? <div className="mt-6 h-40 animate-pulse rounded-xl bg-white/10" /> : <form onSubmit={saveProfile} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-white/80">Nombre<input value={profile.name} onChange={(event) => updateProfileField("name", event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-white outline-none focus:border-emerald-400" /></label><label className="text-sm font-semibold text-white/80">Apellido<input value={profile.lastName} onChange={(event) => updateProfileField("lastName", event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-white outline-none focus:border-emerald-400" /></label></div>
            <label className="block text-sm font-semibold text-white/80">Correo electrónico<input type="email" value={profile.email} onChange={(event) => updateProfileField("email", event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-white outline-none focus:border-emerald-400" /></label>
            <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white/10 px-3 py-1.5 text-white/70">Estado: {profile.status ? "Activo" : "Inactivo"}</span>{profile.timeOut && <span className="rounded-full bg-white/10 px-3 py-1.5 text-white/70">Vigencia: {new Date(profile.timeOut).toLocaleDateString("es-ES")}</span>}</div>

            {changingEmail && <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4"><h3 className="font-bold text-amber-200">Verifica el cambio de correo</h3><p className="mt-1 text-sm text-white/60">Por seguridad, primero confirmas el correo actual y luego el correo nuevo.</p>
              {emailStep === "idle" && <button type="button" onClick={requestCurrentEmailCode} disabled={Boolean(loading)} className="mt-4 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60">{loading === "current-email" ? "Enviando..." : "1. Enviar código al correo actual"}</button>}
              {emailStep === "current-sent" && <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={currentCode} onChange={(event) => setCurrentCode(sixDigits(event.target.value))} inputMode="numeric" autoComplete="one-time-code" placeholder="Código actual" className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 tracking-[0.3em] text-white outline-none sm:w-52" /><button type="button" onClick={verifyCurrentEmailCode} disabled={Boolean(loading)} className="rounded-xl border border-amber-300/40 px-4 py-2.5 text-sm font-bold text-amber-200">Verificar correo actual</button></div>}
              {emailStep === "current-verified" && <button type="button" onClick={requestNewEmailCode} disabled={Boolean(loading)} className="mt-4 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">{loading === "new-email" ? "Enviando..." : "2. Enviar código al correo nuevo"}</button>}
              {emailStep === "new-sent" && <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={newEmailCode} onChange={(event) => setNewEmailCode(sixDigits(event.target.value))} inputMode="numeric" autoComplete="one-time-code" placeholder="Código nuevo" className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 tracking-[0.3em] text-white outline-none sm:w-52" /><button type="button" onClick={verifyNewEmailCode} disabled={Boolean(loading)} className="rounded-xl border border-amber-300/40 px-4 py-2.5 text-sm font-bold text-amber-200">Verificar correo nuevo</button></div>}
              {emailStep === "new-verified" && <p className="mt-4 text-sm font-semibold text-emerald-300">Ambos correos fueron verificados. Ya puedes guardar los datos.</p>}
            </div>}
            <button type="submit" disabled={Boolean(loading) || (changingEmail && emailStep !== "new-verified")} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">{loading === "profile" ? "Guardando..." : "Guardar datos"}</button>
          </form>}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 p-5 sm:p-7" style={{ background: "rgba(255,255,255,0.05)" }}><h2 className="text-xl font-bold">Cambiar contraseña</h2><p className="mt-1 text-sm text-white/55">Se requiere un código de seis dígitos enviado a tu correo registrado.</p>
          <div className="mt-5 space-y-4"><button type="button" onClick={requestPasswordCode} disabled={Boolean(loading)} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{loading === "password-code" ? "Enviando..." : passwordStep === "idle" ? "Enviar código" : "Reenviar código"}</button>
          {passwordStep === "sent" && <form onSubmit={verifyPasswordCode} className="flex flex-col gap-3 sm:flex-row"><input value={passwordCode} onChange={(event) => setPasswordCode(sixDigits(event.target.value))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 tracking-[0.35em] text-white outline-none sm:w-52" /><button type="submit" disabled={Boolean(loading)} className="rounded-xl border border-emerald-400/40 px-4 py-2.5 text-sm font-bold text-emerald-300">Verificar código</button></form>}
          {passwordStep === "verified" && <form onSubmit={changePassword} className="grid gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-4 sm:grid-cols-2"><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="Nueva contraseña" className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-white outline-none" /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Confirmar contraseña" className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-white outline-none" /><button type="submit" disabled={Boolean(loading)} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white sm:col-span-2">{loading === "password" ? "Actualizando..." : "Cambiar contraseña"}</button></form>}</div>
        </section>
      </div></main>
    </div>
  )
}
