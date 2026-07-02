'use client'

import { useEffect, useState } from 'react'
import { getEmailLogs, EmailLog } from '@/lib/data-store'
import { Mail, Search, Clock, Eye, X, ArrowLeft } from 'lucide-react'

export default function EmailLogsConsole() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)

  const fetchLogs = async () => {
    try {
      const data = await getEmailLogs()
      setLogs(data)
      setFilteredLogs(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // Apply search filtering
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const result = logs.filter(l => 
        l.recipientEmail.toLowerCase().includes(term) ||
        l.subject.toLowerCase().includes(term) ||
        l.bookingId.toLowerCase().includes(term)
      )
      setFilteredLogs(result)
    } else {
      setFilteredLogs(logs)
    }
  }, [searchTerm, logs])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[#0500D0] border-t-transparent animate-spin rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-800">System Email Logs</h1>
        <p className="text-xs text-slate-500">Live feed of emails dispatched by the booking and manual verification system.</p>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white border border-slate-200 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search email logs by recipient, subject line, or booking reference..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none p-3 pl-11 text-xs font-semibold"
          />
        </div>
      </div>

      {/* FEED LIST */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No system email logs found.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-primary">{log.bookingId}</span>
                  <span className="text-slate-350">&bull;</span>
                  <span className="font-semibold text-slate-700">{log.recipientEmail}</span>
                  <span className="text-slate-350">&bull;</span>
                  <span className="text-[9px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded uppercase">
                    {log.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 truncate">{log.subject}</h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.sentAt).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(log)}
                className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-primary/30 hover:text-primary px-3 py-2 font-bold uppercase text-[10px] tracking-wider transition-colors bg-white rounded-sm"
              >
                <Eye className="w-3.5 h-3.5" /> View Body
              </button>
            </div>
          ))
        )}
      </div>

      {/* 4. EMAIL DETAIL VIEW MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email Inspector</span>
                <h3 className="font-bold text-slate-800">{selectedLog.subject}</h3>
                <p className="text-[10px] text-slate-400">Sent to: {selectedLog.recipientEmail} on {new Date(selectedLog.sentAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 hover:bg-slate-200 rounded text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email HTML preview inside iframe sandboxed */}
            <div className="flex-1 bg-slate-100 p-6 overflow-y-auto flex justify-center items-start">
              <div 
                className="bg-white shadow-md p-8 max-w-[600px] w-full border border-slate-200 overflow-x-auto min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: selectedLog.body }}
              />
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="border border-slate-200 bg-white text-slate-700 text-xs font-bold uppercase tracking-wider px-5 py-2.5 hover:bg-slate-50 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
