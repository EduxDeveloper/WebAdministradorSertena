export default function ViewModeToggle({ value, onChange }) {
  return (
    <div className="admin-tabs">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`admin-tab ${value === "list" ? "admin-tab--active" : ""}`}
      >
        Lista
      </button>
      <button
        type="button"
        onClick={() => onChange("cards")}
        className={`admin-tab ${value === "cards" ? "admin-tab--active" : ""}`}
      >
        Tarjetas
      </button>
    </div>
  )
}
