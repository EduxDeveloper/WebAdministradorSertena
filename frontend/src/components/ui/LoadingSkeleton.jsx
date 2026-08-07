const block = "animate-pulse rounded-lg bg-white/10"

export function TableLoadingRows({ columns = 4, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-white/5">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex} className="px-6 py-5">
              <div className={`${block} h-4 ${columnIndex === 0 ? "w-28" : columnIndex === columns - 1 ? "w-16 ml-auto" : "w-full max-w-40"}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function CardsLoadingGrid({ cards = 6 }) {
  return (
    <>
      {Array.from({ length: cards }).map((_, index) => (
        <article key={index} className="animate-pulse rounded-2xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className={`${block} h-5 w-3/5`} />
              <div className={`${block} h-3 w-4/5`} />
            </div>
            <div className={`${block} h-8 w-16`} />
          </div>
          <div className="mt-5 space-y-2">
            <div className={`${block} h-3 w-full`} />
            <div className={`${block} h-3 w-2/3`} />
          </div>
          <div className="mt-5 flex gap-2">
            <div className={`${block} h-9 flex-1`} />
            <div className={`${block} h-9 flex-1`} />
          </div>
        </article>
      ))}
    </>
  )
}

export function ServiceCardsLoadingGrid() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="animate-pulse overflow-hidden rounded-2xl border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="h-52 bg-white/10" />
          <div className="space-y-3 p-5">
            <div className={`${block} h-5 w-3/5`} />
            <div className={`${block} h-3 w-full`} />
            <div className={`${block} h-3 w-4/5`} />
            <div className="flex justify-between pt-2"><div className={`${block} h-4 w-24`} /><div className={`${block} h-9 w-24`} /></div>
          </div>
        </article>
      ))}
    </>
  )
}
