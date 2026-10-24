import { useEffect, useState } from 'react'
import { History, Search, Trash2, RefreshCw, Download, Printer } from 'lucide-react'
import { API_BASE_URL } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

type CaseRecord = {
  id: number
  message: string
  risk_level: string
  risk_score: number
  created_at: string | null
}

export default function CaseHistory() {
  const { t } = useLanguage()
  const [records, setRecords] = useState<CaseRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function fetchHistory() {
    setLoading(true)
    try {
      const q = encodeURIComponent(search.trim())
      const url = q ? `${API_BASE_URL}/api/history?q=${q}` : `${API_BASE_URL}/api/history?limit=50`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setRecords(data.history || [])
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory()
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  async function deleteRecord(id: number) {
    setDeletingId(id)
    try {
      const res = await fetch(`${API_BASE_URL}/api/history/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setRecords((prev) => prev.filter((item) => item.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete scan record:', err)
    } finally {
      setDeletingId(null)
    }
  }

  function exportCSV() {
    if (records.length === 0) return
    const headers = ['Scan ID', 'Message', 'Risk Level', 'Risk Score', 'Timestamp']
    const rows = records.map((r) => [
      r.id,
      `"${r.message.replace(/"/g, '""')}"`,
      r.risk_level,
      r.risk_score,
      r.created_at || '',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `scamshield_incident_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function printReport() {
    window.print()
  }

  return (
    <div className="page-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <History size={32} />
          <div>
            <h1>{t('history.title')}</h1>
            <p>{t('history.subtitle')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="secondary-button"
            onClick={exportCSV}
            disabled={records.length === 0}
            title="Download CSV spreadsheet"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}
          >
            <Download size={16} />
            {t('history.export_csv')}
          </button>
          <button
            className="secondary-button"
            onClick={printReport}
            disabled={records.length === 0}
            title="Print or save PDF report"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}
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

        {loading && records.length === 0 ? (
          <p style={{ marginTop: 20 }}>Loading scan history from database...</p>
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

              return (
                <div className="history-item" key={record.id}>
                  <div>
                    <h3>Scan #{record.id}</h3>
                    <p>{record.message}</p>
                    <small>{formattedDate}</small>
                  </div>

                  <div className="history-actions">
                    <span className="risk-badge">
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

      <p className="disclaimer">
        {t('history.disclaimer')}
      </p>
    </div>
  )
}