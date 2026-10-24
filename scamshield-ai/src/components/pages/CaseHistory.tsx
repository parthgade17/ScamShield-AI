import { useEffect, useState, useCallback } from 'react'
import {
  History,
  Search,
  Trash2,
  RefreshCw,
  Download,
  Printer,
  Database,
  AlertCircle,
} from 'lucide-react'
import {
  API_BASE_URL,
  SUPABASE_URL,
  SUPABASE_HEADERS,
  dbLogger,
  fetchWithTimeout,
  fetchHistoryFromSupabase,
  type CaseHistoryItem,
} from '../../api'
import { useLanguage } from '../../context/LanguageContext'

export default function CaseHistory() {
  const { t } = useLanguage()
  const [records, setRecords] = useState<CaseHistoryItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [dataSource, setDataSource] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    const q = encodeURIComponent(search.trim())
    const backendUrl = q
      ? `${API_BASE_URL}/api/history?q=${q}`
      : `${API_BASE_URL}/api/history?limit=50`

    dbLogger.info('CaseHistory', `Fetching scan history from backend (${backendUrl})...`)

    try {
      // 1. Try backend API first
      const res = await fetchWithTimeout(backendUrl, {}, 4500)
      if (res.ok) {
        const data = await res.json()
        const historyItems: CaseHistoryItem[] = data.history || []
        setRecords(historyItems)
        setDataSource('Backend API (Postgres)')
        dbLogger.success(
          'CaseHistory',
          `Successfully loaded ${historyItems.length} cases from backend:`,
          historyItems
        )
        return
      }
      throw new Error(`Backend returned HTTP status ${res.status}`)
    } catch (backendErr) {
      dbLogger.warn(
        'CaseHistory',
        'Backend unreachable or request timed out. Querying Supabase PostgREST directly...',
        backendErr instanceof Error ? backendErr.message : String(backendErr)
      )

      // 2. Failover directly to Supabase PostgREST
      try {
        const supabaseRecords = await fetchHistoryFromSupabase(search.trim())
        setRecords(supabaseRecords)
        setDataSource('Supabase Direct')
        dbLogger.success(
          'CaseHistory',
          `Successfully loaded ${supabaseRecords.length} cases from Supabase Direct:`,
          supabaseRecords
        )
      } catch (supabaseErr) {
        dbLogger.error(
          'CaseHistory',
          'Failed to retrieve scan history from both Backend and Supabase.',
          supabaseErr,
          'Inspect console with window.__scamshield_debug.testSupabase()'
        )
        setErrorMessage(
          'Could not load case history from database. Open DevTools (F12) to inspect logs or click Retry.'
        )
      }
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchHistory])

  async function deleteRecord(id: number) {
    setDeletingId(id)
    dbLogger.info('CaseHistory', `Deleting scan record #${id}...`)

    try {
      // 1. Try Backend deletion
      let deleted = false
      try {
        const res = await fetchWithTimeout(
          `${API_BASE_URL}/api/history/${id}`,
          { method: 'DELETE' },
          3500
        )
        if (res.ok) deleted = true
      } catch {
        // Backend offline, fallback to Supabase direct
      }

      // 2. Supabase Direct fallback deletion
      if (!deleted) {
        const supaRes = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/scan_history?id=eq.${id}`,
          {
            method: 'DELETE',
            headers: SUPABASE_HEADERS,
          },
          3500
        )
        if (supaRes.ok) deleted = true
      }

      if (deleted) {
        setRecords((prev) => prev.filter((item) => item.id !== id))
        dbLogger.success('CaseHistory', `Successfully deleted record #${id} from database.`)
      } else {
        throw new Error(`Failed to delete record #${id}`)
      }
    } catch (err) {
      dbLogger.error('CaseHistory', `Failed to delete scan record #${id}:`, err)
      window.alert(`Could not delete record #${id}. Check console for details.`)
    } finally {
      setDeletingId(null)
    }
  }

  function exportCSV() {
    if (records.length === 0) return
    const headers = ['Scan ID', 'Message', 'Risk Level', 'Risk Score', 'Timestamp', 'Detection Method']
    const rows = records.map((r) => [
      r.id,
      `"${(r.message || '').replace(/"/g, '""')}"`,
      r.risk_level,
      r.risk_score,
      r.created_at || '',
      r.detection_method || 'rule+Gemini based',
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `scamshield_incident_report_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    dbLogger.info('CaseHistory', `Exported ${records.length} records to CSV report.`)
  }

  function printReport() {
    window.print()
  }

  return (
    <div className="page-container">
      <div
        className="page-title"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <History size={32} />
          <div>
            <h1>{t('history.title')}</h1>
            <p>{t('history.subtitle')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {dataSource && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                padding: '5px 10px',
                borderRadius: 20,
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                fontWeight: 600,
                border: '1px solid rgba(37, 99, 235, 0.2)',
              }}
              title="Active database source"
            >
              <Database size={13} />
              {dataSource}
            </span>
          )}

          <button
            className="secondary-button"
            onClick={exportCSV}
            disabled={records.length === 0}
            title="Download CSV spreadsheet"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <Download size={16} />
            {t('history.export_csv')}
          </button>

          <button
            className="secondary-button"
            onClick={printReport}
            disabled={records.length === 0}
            title="Print or save PDF report"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <Printer size={16} />
            {t('history.print_report')}
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="search-row" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Search size={20} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('history.search_placeholder')}
            style={{ flex: 1 }}
          />
          <button
            className="icon-button"
            title="Refresh history"
            onClick={fetchHistory}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'spinner' : ''} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={20} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchHistory}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {loading && records.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, color: '#64748b' }}>
            <RefreshCw size={18} className="spinner" />
            <p>Syncing scan history from Supabase database...</p>
          </div>
        ) : records.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            {search ? 'No matching scans found for your search.' : t('history.no_records')}
          </p>
        ) : (
          <div className="history-list" style={{ marginTop: 20 }}>
            {records.map((record) => {
              const formattedDate = record.created_at
                ? new Date(record.created_at).toLocaleString()
                : 'Recent'

              const riskBadgeColor =
                record.risk_level === 'High'
                  ? '#ef4444'
                  : record.risk_level === 'Medium'
                  ? '#f59e0b'
                  : '#10b981'

              return (
                <div className="history-item" key={record.id}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 style={{ margin: 0 }}>Scan #{record.id}</h3>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: 'rgba(100, 116, 139, 0.12)',
                          color: '#475569',
                          fontWeight: 600,
                        }}
                      >
                        {record.detection_method || 'rule+Gemini based'}
                      </span>
                    </div>
                    <p style={{ marginTop: 6, marginBottom: 4 }}>{record.message}</p>
                    <small>{formattedDate}</small>
                  </div>

                  <div className="history-actions">
                    <span
                      className="risk-badge"
                      style={{
                        borderColor: riskBadgeColor,
                        color: riskBadgeColor,
                        fontWeight: 700,
                      }}
                    >
                      {record.risk_level} ({record.risk_score}/100)
                    </span>

                    <button
                      className="icon-button"
                      aria-label={`Delete scan ${record.id}`}
                      title={t('history.delete_tooltip')}
                      disabled={deletingId === record.id}
                      onClick={() => deleteRecord(record.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="disclaimer">{t('history.disclaimer')}</p>
    </div>
  )
}