import { useEffect, useState } from "react"
import AdminLayout, { AdminPageHeader, AdminPrimaryButton, AdminSecondaryButton } from "../../components/ui/AdminLayout"
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
    <AdminLayout activeTab="Configuración">
      <div className="mx-auto max-w-4xl w-full flex flex-col gap-6">
        <AdminPageHeader
          eyebrow="Bienvenido, Administrador"
          title="Configuración de seguridad"
          description="Actualiza tu perfil y protege los cambios sensibles mediante códigos de verificación."
        />

        {message.text && (
          <div className={`admin-card admin-card-padded text-sm ${message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {message.text}
          </div>
        )}

        <section className="admin-card admin-card-padded">
          <h2 className="text-xl font-bold text-slate-900">Datos del administrador</h2>
          <p className="mt-1 text-sm admin-text-muted">Nombre y apellido se actualizan al guardar. El correo requiere doble verificación.</p>
          {profileLoading ? (
            <div className="mt-6 h-40 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <form onSubmit={saveProfile} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="admin-label">Nombre
                  <input value={profile.name} onChange={(event) => updateProfileField("name", event.target.value)} className="admin-input" />
                </label>
                <label className="admin-label">Apellido
                  <input value={profile.lastName} onChange={(event) => updateProfileField("lastName", event.target.value)} className="admin-input" />
                </label>
              </div>
              <label className="admin-label">Correo electrónico
                <input type="email" value={profile.email} onChange={(event) => updateProfileField("email", event.target.value)} className="admin-input" />
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="admin-badge admin-badge--slate">Estado: {profile.status ? "Activo" : "Inactivo"}</span>
                {profile.timeOut && <span className="admin-badge admin-badge--slate">Vigencia: {new Date(profile.timeOut).toLocaleDateString("es-ES")}</span>}
              </div>

              {changingEmail && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h3 className="font-bold text-amber-800">Verifica el cambio de correo</h3>
                  <p className="mt-1 text-sm admin-text-muted">Por seguridad, primero confirmas el correo actual y luego el correo nuevo.</p>
                  {emailStep === "idle" && (
                    <AdminPrimaryButton type="button" onClick={requestCurrentEmailCode} disabled={Boolean(loading)} className="mt-4">
                      {loading === "current-email" ? "Enviando..." : "1. Enviar código al correo actual"}
                    </AdminPrimaryButton>
                  )}
                  {emailStep === "current-sent" && (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input value={currentCode} onChange={(event) => setCurrentCode(sixDigits(event.target.value))} inputMode="numeric" autoComplete="one-time-code" placeholder="Código actual" className="admin-input sm:w-52 tracking-[0.3em]" />
                      <AdminSecondaryButton type="button" onClick={verifyCurrentEmailCode} disabled={Boolean(loading)}>Verificar correo actual</AdminSecondaryButton>
                    </div>
                  )}
                  {emailStep === "current-verified" && (
                    <AdminPrimaryButton type="button" onClick={requestNewEmailCode} disabled={Boolean(loading)} className="mt-4">
                      {loading === "new-email" ? "Enviando..." : "2. Enviar código al correo nuevo"}
                    </AdminPrimaryButton>
                  )}
                  {emailStep === "new-sent" && (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input value={newEmailCode} onChange={(event) => setNewEmailCode(sixDigits(event.target.value))} inputMode="numeric" autoComplete="one-time-code" placeholder="Código nuevo" className="admin-input sm:w-52 tracking-[0.3em]" />
                      <AdminSecondaryButton type="button" onClick={verifyNewEmailCode} disabled={Boolean(loading)}>Verificar correo nuevo</AdminSecondaryButton>
                    </div>
                  )}
                  {emailStep === "new-verified" && (
                    <p className="mt-4 text-sm font-semibold text-emerald-700">Ambos correos fueron verificados. Ya puedes guardar los datos.</p>
                  )}
                </div>
              )}
              <AdminPrimaryButton type="submit" disabled={Boolean(loading) || (changingEmail && emailStep !== "new-verified")}>
                {loading === "profile" ? "Guardando..." : "Guardar datos"}
              </AdminPrimaryButton>
            </form>
          )}
        </section>

        <section className="admin-card admin-card-padded">
          <h2 className="text-xl font-bold text-slate-900">Cambiar contraseña</h2>
          <p className="mt-1 text-sm admin-text-muted">Se requiere un código de seis dígitos enviado a tu correo registrado.</p>
          <div className="mt-5 space-y-4">
            <AdminPrimaryButton type="button" onClick={requestPasswordCode} disabled={Boolean(loading)}>
              {loading === "password-code" ? "Enviando..." : passwordStep === "idle" ? "Enviar código" : "Reenviar código"}
            </AdminPrimaryButton>
            {passwordStep === "sent" && (
              <form onSubmit={verifyPasswordCode} className="flex flex-col gap-3 sm:flex-row">
                <input value={passwordCode} onChange={(event) => setPasswordCode(sixDigits(event.target.value))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="admin-input sm:w-52 tracking-[0.35em]" />
                <AdminSecondaryButton type="submit" disabled={Boolean(loading)}>Verificar código</AdminSecondaryButton>
              </form>
            )}
            {passwordStep === "verified" && (
              <form onSubmit={changePassword} className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-2">
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="Nueva contraseña" className="admin-input" />
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Confirmar contraseña" className="admin-input" />
                <AdminPrimaryButton type="submit" disabled={Boolean(loading)} className="sm:col-span-2">
                  {loading === "password" ? "Actualizando..." : "Cambiar contraseña"}
                </AdminPrimaryButton>
              </form>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
