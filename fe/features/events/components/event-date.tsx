const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
})

export function formatDateRange(startIso: string, endIso?: string) {
  const start = new Date(startIso)
  if (!endIso) return dateFormatter.format(start)

  const end = new Date(endIso)
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  if (sameDay) return dateFormatter.format(start)
  return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`
}

export function formatTimeRange(startIso: string, endIso: string) {
  return `${timeFormatter.format(new Date(startIso))} – ${timeFormatter.format(
    new Date(endIso)
  )} WIB`
}

export function formatDateTime(iso: string) {
  return `${dateFormatter.format(new Date(iso))} ${timeFormatter.format(
    new Date(iso)
  )}`
}
