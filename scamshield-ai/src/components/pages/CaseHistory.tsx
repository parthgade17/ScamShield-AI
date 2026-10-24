import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  History,
  Search,
  Trash2,
  RefreshCw,
  Download,
  Printer,
  Database,
  AlertCircle,
  Link as LinkIcon,
  MessageSquareWarning,
  Layers,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import {
  API_BASE_URL,
  SUPABASE_URL,
  SUPABASE_HEADERS,
  dbLogger,
  fetchWithTimeout,
  fetchHistoryFromSupabase,
  fetchLinkHistoryFromSupabase,
  type CaseHistoryItem,
  type LinkHistoryItem,
} from '../../api'
import { useLanguage } from '../../context/LanguageContext'

type UnifiedHistoryRecord = {
  type: 'message' | 'link'
  id: number
  primaryText: string
  secondaryText?: string | null
  domain?: string | null
  risk_level: string
  risk_score: number
  created_at: string | null
  badgeLabel: string
  warnings?: string[]
}

export default function CaseHistory() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'links'>('all')
  const [messages, setMessages] = useState<CaseHistoryItem[]>([])
  const [links, setLinks] = useState<LinkHistoryItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchAllHistory = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    const q = encodeURIComponent(search.trim())

    const messagesUrl = q
      ? `${API_BASE_URL}/api/history?q=${q}`
      : `${API_BASE_URL}/api/history?limit=50`
    const linksUrl = q
      ? `${API_BASE_URL}/api/links/history?q=${q}`
      : `${API_BASE_URL}/api/links/history?limit=50`

    dbLogger.info('CaseHistory', `Fetching unified scan & link history...`)

    let loadedMessages: CaseHistoryItem[] = []
    let loadedLinks: LinkHistoryItem[] = []
    let usedBackend = false

    // 1. Try Backend API first for both endpoints
    try {
      const [msgRes, linkRes] = await Promise.all([
        fetchWithTimeout(messagesUrl, {}, 4500).catch(() => null),
        fetchWithTimeout(linksUrl, {}, 4500).catch(() => null),
      ])

      if (msgRes && msgRes.ok) {
        const data = await msgRes.json()
        loadedMessages = data.history || []
        usedBackend = true
      }
      if (linkRes && linkRes.ok) {
        const data = await linkRes.json()
        loadedLinks = data.items || []
        usedBackend = true
      }

      if (usedBackend) {
        setMessages(loadedMessages)
        setLinks(loadedLinks)
        setDataSource('Backend API (Postgres)')
        dbLogger.success(
          'CaseHistory',
          `Loaded ${loadedMessages.length} messages and ${loadedLinks.length} links from Backend.`
        )
      }
    } catch (backendErr) {
      dbLogger.warn('CaseHistory', 'Backend query failed. Proceeding to Supabase fallback...', backendErr)
    }

    // 2. If backend failed or returned empty in offline mode, failover to Supabase PostgREST
    if (!usedBackend) {
      try {
        const [supaMsgs, supaLinks] = await Promise.all([
          fetchHistoryFromSupabase(search.trim()).catch(() => []),
          fetchLinkHistoryFromSupabase(search.trim()).catch(() => []),
        ])

        setMessages(supaMsgs)
        setLinks(supaLinks)
        setDataSource('Supabase Direct')
        dbLogger.success(
          'CaseHistory',
          `Loaded ${supaMsgs.length} messages and ${supaLinks.length} links from Supabase Direct.`
        )
      } catch (supabaseErr) {
        dbLogger.error(
          'CaseHistory',
          'Failed to retrieve history from both Backend and Supabase.',
          supabaseErr
        )
        setErrorMessage(
          'Could not load case history from database. Open DevTools (F12) to inspect logs or click Retry.'
        )
      }
    }

    setLoading(false)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllHistory()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchAllHistory])

  // Map and sort unified list chronologically
  const unifiedRecords: UnifiedHistoryRecord[] = useMemo(() => {
    const list: UnifiedHistoryRecord[] = []

    if (activeTab === 'all' || activeTab === 'messages') {
      messages.forEach((m) => {
        list.push({
          type: 'message',
          id: m.id,
          primaryText: m.message,
          risk_level: m.risk_level,
          risk_score: m.risk_score,
          created_at: m.created_at,
          badgeLabel: m.detection_method || t('history.scan_type'),
        })
      })
    }

    if (activeTab === 'all' || activeTab === 'links') {
      links.forEach((l) => {
        list.push({
          type: 'link',
          id: l.id,
          primaryText: l.url,
          secondaryText: l.domain ? `Domain: ${l.domain}` : undefined,
          domain: l.domain,
          risk_level: l.risk_level,
          risk_score: l.risk_score,
          created_at: l.created_at,
          badgeLabel: t('history.link_type'),
          warnings: l.warnings,
        })
      })
    }

    // Sort descending by date, fallback to ID
    return list.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id
      const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id
      return timeB - timeA
    })
  }, [messages, links, activeTab, t])

  // Delete message scan record
  async function deleteMessageRecord(id: number) {
    const key = `msg-${id}`
    setDeletingKey(key)
    dbLogger.info('CaseHistory', `Deleting message scan record #${id}...`)

    try {
      let deleted = false
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/history/${id}`, { method: 'DELETE' }, 3500)
        if (res.ok) deleted = true
      } catch {
        // Backend offline
      }

      if (!deleted) {
        const supaRes = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/scan_history?id=eq.${id}`,
          { method: 'DELETE', headers: SUPABASE_HEADERS },
          3500
        )
        if (supaRes.ok) deleted = true
      }

      if (deleted) {
        setMessages((prev) => prev.filter((item) => item.id !== id))
        dbLogger.success('CaseHistory', `Successfully deleted message record #${id}.`)
      } else {
        throw new Error(`Failed to delete message record #${id}`)
      }
    } catch (err) {
      dbLogger.error('CaseHistory', `Failed to delete message record #${id}:`, err)
      window.alert(`Could not delete record #${id}. Check console for details.`)
    } finally {
      setDeletingKey(null)
    }
  }

  // Delete link check record
  async function deleteLinkRecord(id: number) {
    const key = `link-${id}`
    setDeletingKey(key)
    dbLogger.info('CaseHistory', `Deleting link check record #${id}...`)

    try {
      let deleted = false
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/links/${id}`, { method: 'DELETE' }, 3500)
        if (res.ok) deleted = true
      } catch {
        // Backend offline
      }

      if (!deleted) {
        const supaRes = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/link_checks?id=eq.${id}`,
          { method: 'DELETE', headers: SUPABASE_HEADERS },
          3500
        )
        if (supaRes.ok) deleted = true
      }

      if (deleted) {
        setLinks((prev) => prev.filter((item) => item.id !== id))
        dbLogger.success('CaseHistory', `Successfully deleted link check #${id}.`)
      } else {
        throw new Error(`Failed to delete link check #${id}`)
      }
    } catch (err) {
      dbLogger.error('CaseHistory', `Failed to delete link check #${id}:`, err)
      window.alert(`Could not delete link check #${id}. Check console for details.`)
    } finally {
      setDeletingKey(null)
    }
  }

  function exportCSV() {
    if (unifiedRecords.length === 0) return
    const headers = ['Record Type', 'ID', 'Content / URL', 'Domain', 'Risk Level', 'Risk Score', 'Timestamp', 'Warnings / Method']
    const rows = unifiedRecords.map((r) => [
      r.type === 'link' ? 'Link Check' : 'Message Scan',
      r.id,
      `"${(r.primaryText || '').replace(/"/g, '""')}"`,
      r.domain || '',
      r.risk_level,
      r.risk_score,
      r.created_at || '',
      r.warnings && r.warnings.length > 0 ? `"${r.warnings.join('; ').replace(/"/g, '""')}"` : r.badgeLabel,
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `scamshield_case_history_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    dbLogger.info('CaseHistory', `Exported ${unifiedRecords.length} records to CSV report.`)
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
            disabled={unifiedRecords.length === 0}
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
            disabled={unifiedRecords.length === 0}
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
        {/* Search Bar */}
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
            onClick={fetchAllHistory}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'spinner' : ''} />
          </button>
        </div>

        {/* Filter Tabs: All, Messages, Links */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 18,
            marginBottom: 6,
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            paddingBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setActiveTab('all')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'all' ? '1px solid #2563eb' : '1px solid transparent',
              background: activeTab === 'all' ? '#2563eb' : 'rgba(100, 116, 139, 0.08)',
              color: activeTab === 'all' ? '#ffffff' : 'inherit',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={15} />
            {t('history.tab_all')} ({messages.length + links.length})
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'messages' ? '1px solid #2563eb' : '1px solid transparent',
              background: activeTab === 'messages' ? '#2563eb' : 'rgba(100, 116, 139, 0.08)',
              color: activeTab === 'messages' ? '#ffffff' : 'inherit',
              transition: 'all 0.15s ease',
            }}
          >
            <MessageSquareWarning size={15} />
            {t('history.tab_messages')} ({messages.length})
          </button>

          <button
            onClick={() => setActiveTab('links')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'links' ? '1px solid #2563eb' : '1px solid transparent',
              background: activeTab === 'links' ? '#2563eb' : 'rgba(100, 116, 139, 0.08)',
              color: activeTab === 'links' ? '#ffffff' : 'inherit',
              transition: 'all 0.15s ease',
            }}
          >
            <LinkIcon size={15} />
            {t('history.tab_links')} ({links.length})
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
              onClick={fetchAllHistory}
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

        {loading && unifiedRecords.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, color: '#64748b' }}>
            <RefreshCw size={18} className="spinner" />
            <p>Syncing scan & link history from Supabase database...</p>
          </div>
        ) : unifiedRecords.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            {search ? 'No matching scans or links found for your search.' : t('history.no_records')}
          </p>
        ) : (
          <div className="history-list" style={{ marginTop: 20 }}>
            {unifiedRecords.map((record) => {
              const formattedDate = record.created_at
                ? new Date(record.created_at).toLocaleString()
                : 'Recent'

              const riskBadgeColor =
                record.risk_level === 'High'
                  ? '#ef4444'
                  : record.risk_level === 'Medium'
                  ? '#f59e0b'
                  : '#10b981'

              const isLink = record.type === 'link'
              const itemKey = `${record.type}-${record.id}`
              const isDeleting = deletingKey === itemKey

              return (
                <div className="history-item" key={itemKey}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: isLink ? 'rgba(37, 99, 235, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: isLink ? '#2563eb' : '#059669',
                        }}
                      >
                        {isLink ? <LinkIcon size={12} /> : <MessageSquareWarning size={12} />}
                        {isLink ? t('history.link_type') : t('history.scan_type')} #{record.id}
                      </span>

                      {!isLink && record.badgeLabel && (
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
                          {record.badgeLabel}
                        </span>
                      )}

                      {isLink && record.domain && (
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
                          🌐 {record.domain}
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        marginTop: 8,
                        marginBottom: 4,
                        wordBreak: 'break-all',
                        fontFamily: isLink ? 'monospace' : 'inherit',
                        fontSize: isLink ? '0.95rem' : '1.02rem',
                      }}
                    >
                      {record.primaryText}
                    </p>

                    {/* Warnings list for links */}
                    {isLink && record.warnings && record.warnings.length > 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          marginBottom: 6,
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: 'rgba(239, 68, 68, 0.06)',
                          borderLeft: '3px solid #ef4444',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#b91c1c',
                            marginBottom: 4,
                          }}
                        >
                          <ShieldAlert size={14} />
                          <span>
                            {record.warnings.length} {t('history.warnings_found')}
                          </span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#7f1d1d' }}>
                          {record.warnings.map((w, idx) => (
                            <li key={idx} style={{ marginTop: 2 }}>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <small style={{ color: '#64748b' }}>{formattedDate}</small>

                      {isLink && (
                        <a
                          href={record.primaryText}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          {t('history.visit_link')} <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
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
                      aria-label={`Delete record ${record.id}`}
                      title={t('history.delete_tooltip')}
                      disabled={isDeleting}
                      onClick={() => {
                        if (record.type === 'link') {
                          deleteLinkRecord(record.id)
                        } else {
                          deleteMessageRecord(record.id)
                        }
                      }}
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