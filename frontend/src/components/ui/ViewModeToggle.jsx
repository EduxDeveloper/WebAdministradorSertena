export default function ViewModeToggle({ value, onChange }) {
  return (
    <div className="inline-flex self-start overflow-hidden rounded-xl border border-white/10">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`px-3 py-2 text-xs font-semibold transition-colors ${value === "list" ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}
      >
        Lista
      </button>
      <button
        type="button"
        onClick={() => onChange("cards")}
        className={`px-3 py-2 text-xs font-semibold transition-colors ${value === "cards" ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}
      >
        Tarjetas
      </button>
    </div>
  )
}
