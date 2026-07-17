/** Editor turnaround: 12 days from raw-photo approval. */
export const EDITOR_DEADLINE_DAYS = 12

/** Local YYYY-MM-DD for editor day folders (approval day starts the edit clock). */
export function getEditorFolderDayKey(booking: {
  rawPhotoApprovedAt?: string
  rawPhotoSubmittedAt?: string
}): string {
  const raw = booking.rawPhotoApprovedAt || booking.rawPhotoSubmittedAt
  if (!raw) return 'undated'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return 'undated'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getEditorDeadlineStart(booking: {
  rawPhotoApprovedAt?: string
  rawPhotoSubmittedAt?: string
}): Date | null {
  const raw = booking.rawPhotoApprovedAt || booking.rawPhotoSubmittedAt
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export function getEditorDeadlineEnd(booking: {
  rawPhotoApprovedAt?: string
  rawPhotoSubmittedAt?: string
}): Date | null {
  const start = getEditorDeadlineStart(booking)
  if (!start) return null
  const end = new Date(start)
  end.setDate(end.getDate() + EDITOR_DEADLINE_DAYS)
  return end
}

export function getEditorDeadlineInfo(booking: {
  editedPhotoLink?: string
  rawPhotoApprovedAt?: string
  rawPhotoSubmittedAt?: string
}): {
  start: Date | null
  end: Date | null
  daysLeft: number | null
  overdue: boolean
  delivered: boolean
  label: string
} {
  const delivered = Boolean(booking.editedPhotoLink)
  const start = getEditorDeadlineStart(booking)
  const end = getEditorDeadlineEnd(booking)
  if (!end) {
    return {
      start,
      end,
      daysLeft: null,
      overdue: false,
      delivered,
      label: delivered ? 'Delivered' : 'No deadline stamp',
    }
  }

  const now = Date.now()
  const msLeft = end.getTime() - now
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
  const overdue = !delivered && msLeft < 0

  let label: string
  if (delivered) label = 'Delivered'
  else if (overdue) label = `Overdue by ${Math.abs(daysLeft)}d`
  else if (daysLeft === 0) label = 'Due today'
  else if (daysLeft === 1) label = '1 day left'
  else label = `${daysLeft} days left`

  return { start, end, daysLeft, overdue, delivered, label }
}
