'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { syncAdminDatabase } from '@/lib/data-store'

const SYNC_INTERVAL_MS = 8000

type AdminAutoSyncContextValue = {
  syncing: boolean
  lastSyncedAt: Date | null
  lastMessage: string | null
  lastOk: boolean | null
  syncNow: () => Promise<void>
}

const AdminAutoSyncContext = createContext<AdminAutoSyncContextValue | null>(null)

export function AdminAutoSyncProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const running = useRef(false)

  const syncNow = useCallback(async () => {
    if (!enabled || running.current) return
    running.current = true
    setSyncing(true)
    try {
      const result = await syncAdminDatabase()
      setLastSyncedAt(new Date())
      setLastOk(result.ok)
      setLastMessage(result.message ?? (result.ok ? 'Synced' : 'Sync unavailable'))
      if (result.ok) {
        window.dispatchEvent(new CustomEvent('admin:db-synced', { detail: result }))
      }
    } catch {
      setLastOk(false)
      setLastMessage('Sync failed')
    } finally {
      setSyncing(false)
      running.current = false
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    syncNow()
    const interval = setInterval(syncNow, SYNC_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [enabled, syncNow])

  return (
    <AdminAutoSyncContext.Provider value={{ syncing, lastSyncedAt, lastMessage, lastOk, syncNow }}>
      {children}
    </AdminAutoSyncContext.Provider>
  )
}

export function useAdminAutoSync() {
  const ctx = useContext(AdminAutoSyncContext)
  if (!ctx) {
    return {
      syncing: false,
      lastSyncedAt: null,
      lastMessage: null,
      lastOk: null,
      syncNow: async () => {},
    }
  }
  return ctx
}

/** Re-fetch page data whenever background sync completes. */
export function useOnAdminDbSync(callback: () => void) {
  useEffect(() => {
    const handler = () => callback()
    window.addEventListener('admin:db-synced', handler)
    return () => window.removeEventListener('admin:db-synced', handler)
  }, [callback])
}
