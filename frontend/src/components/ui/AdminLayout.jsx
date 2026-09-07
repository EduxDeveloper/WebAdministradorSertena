import Sidebar from "./Sidebar"

/**
 * Layout base del panel administrativo.
 * Sidebar oscuro + area de contenido clara para un aspecto corporativo.
 */
export default function AdminLayout({ activeTab, children }) {
  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} />
      <main className="admin-main">{children}</main>
    </div>
  )
}

export function AdminPageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="admin-page-header">
      <div>
        {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
        <h1 className="admin-title">{title}</h1>
        {description && <p className="admin-subtitle">{description}</p>}
      </div>
      {action && <div className="admin-header-action">{action}</div>}
    </div>
  )
}

export function AdminPrimaryButton({ children, className = "", ...props }) {
  return (
    <button type="button" className={`admin-btn admin-btn-primary ${className}`} {...props}>
      {children}
    </button>
  )
}

export function AdminSecondaryButton({ children, className = "", ...props }) {
  return (
    <button type="button" className={`admin-btn admin-btn-secondary ${className}`} {...props}>
      {children}
    </button>
  )
}

const iconToneClass = {
  green: "admin-icon-box--green",
  blue: "admin-icon-box--blue",
  red: "admin-icon-box--red",
  slate: "admin-icon-box--slate",
  amber: "admin-icon-box--amber",
}

/**
 * Tarjeta de metrica reutilizable para dashboards administrativos.
 */
export function AdminStatCard({
  label,
  value,
  icon,
  iconTone = "slate",
  badge,
  footer,
  valueSize = "lg",
  className = "",
}) {
  return (
    <article className={`admin-stat-card ${className}`}>
      <div className="admin-stat-card__header">
        <p className="admin-stat-label">{label}</p>
        {icon && (
          <div className={`admin-icon-box ${iconToneClass[iconTone] || iconToneClass.slate}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="admin-stat-card__body">
        <p className={valueSize === "md" ? "admin-stat-value admin-stat-value--md" : "admin-stat-value"}>
          {value}
        </p>
        {badge}
      </div>
      {footer && <p className="admin-stat-card__footer">{footer}</p>}
    </article>
  )
}

export function AdminStatGrid({ children, columns = 3, className = "" }) {
  const colClass =
    columns === 4
      ? "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"

  return (
    <div className={`grid ${colClass} gap-4 w-full ${className}`}>
      {children}
    </div>
  )
}
