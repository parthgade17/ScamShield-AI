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
  Image as ImageIcon,
  X,
  Eye,
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
  type: 'message' | 'link' | 'image'
  id: number
  primaryText: string
  secondaryText?: string | null
  domain?: string | null
  thumbnail?: string | null
  risk_level: string
  risk_score: number
  created_at: string | null
  badgeLabel: string
  warnings?: string[]
}

function isImageRecord(m: CaseHistoryItem): boolean {
  const method = (m.detection_method || '').toLowerCase()
  if (method.includes('vision') || method.includes('image') || method.includes('screenshot')) {
    return true
  }
  if (Array.isArray(m.indicators)) {
    for (const ind of m.indicators) {
      if (typeof ind === 'object' && ind !== null) {
        if ('type' in ind && ind.type === 'image_scan') return true
        if ('thumbnail' in ind && Boolean(ind.thumbnail)) return true
      }
    }
  }
  return false
}

function resolveImageThumbnail(m: CaseHistoryItem): string | null {
  if (m.thumbnail) return m.thumbnail
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`scamshield_img_${m.id}`)
    if (cached) return cached
  }
  if (Array.isArray(m.indicators)) {
    for (const ind of m.indicators) {
      if (typeof ind === 'object' && ind !== null && 'thumbnail' in ind && ind.thumbnail) {
        return ind.thumbnail as string
      }
    }
  }
  return null
}

export default function CaseHistory() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'links' | 'images'>('all')
  const [messages, setMessages] = useState<CaseHistoryItem[]>([])
  const [links, setLinks] = useState<LinkHistoryItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

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
          `Loaded ${loadedMessages.length} message/vision scans and ${loadedLinks.length} links from Backend.`
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
          `Loaded ${supaMsgs.length} scans and ${supaLinks.length} links from Supabase Direct.`
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

  // Partition messages into text vs image scans
  const { textScans, imageScans } = useMemo(() => {
    const texts: CaseHistoryItem[] = []
    const imgs: CaseHistoryItem[] = []

    messages.forEach((m) => {
      if (isImageRecord(m)) {
        imgs.push(m)
      } else {
        texts.push(m)
      }
    })

    return { textScans: texts, imageScans: imgs }
  }, [messages])

  // Build unified records based on active tab
  const unifiedRecords: UnifiedHistoryRecord[] = useMemo(() => {
    const list: UnifiedHistoryRecord[] = []

    // 1. Text Message Scans
    if (activeTab === 'all' || activeTab === 'messages') {
      textScans.forEach((m) => {
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

    // 2. Screenshots & Image Scans
    if (activeTab === 'all' || activeTab === 'images') {
      imageScans.forEach((m) => {
        const thumb = resolveImageThumbnail(m)
        list.push({
          type: 'image',
          id: m.id,
          primaryText: m.message,
          thumbnail: thumb,
          risk_level: m.risk_level,
          risk_score: m.risk_score,
          created_at: m.created_at,
          badgeLabel: t('history.image_type'),
          warnings: m.explanation ? [m.explanation] : undefined,
        })
      })
    }

    // 3. Checked Links
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

    // Sort descending by timestamp
    return list.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id
      const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id
      return timeB - timeA
    })
  }, [textScans, imageScans, links, activeTab, t])

  // Delete message / image scan record
  async function deleteScanRecord(id: number) {
    const key = `scan-${id}`
    setDeletingKey(key)
    dbLogger.info('CaseHistory', `Deleting scan record #${id}...`)

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
        try {
          localStorage.removeItem(`scamshield_img_${id}`)
        } catch {
          // ignore
        }
        dbLogger.success('CaseHistory', `Successfully deleted scan record #${id}.`)
      } else {
        throw new Error(`Failed to delete record #${id}`)
      }
    } catch (err) {
      dbLogger.error('CaseHistory', `Failed to delete scan record #${id}:`, err)
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
    const headers = ['Record Type', 'ID', 'Content / URL / OCR Text', 'Domain', 'Risk Level', 'Risk Score', 'Timestamp', 'Warnings / Method']
    const rows = unifiedRecords.map((r) => [
      r.type === 'link' ? 'Link Check' : r.type === 'image' ? 'Screenshot / Image Scan' : 'Message Scan',
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
      {/* Lightbox Modal for Full Image View */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#1e293b',
              borderRadius: 12,
              padding: 12,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: -12,
                right: -12,
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              }}
              title="Close Preview"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Screenshot Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                borderRadius: 8,
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}

      {/* Header Row */}
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

        {/* 4 Interactive Filter Tabs: All, Messages, Links, Screenshots */}
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
            {t('history.tab_all')} ({textScans.length + links.length + imageScans.length})
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
            {t('history.tab_messages')} ({textScans.length})
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

          <button
            onClick={() => setActiveTab('images')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'images' ? '1px solid #9333ea' : '1px solid transparent',
              background: activeTab === 'images' ? '#9333ea' : 'rgba(147, 51, 234, 0.08)',
              color: activeTab === 'images' ? '#ffffff' : '#9333ea',
              transition: 'all 0.15s ease',
            }}
          >
            <ImageIcon size={15} />
            {t('history.tab_images')} ({imageScans.length})
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
            <p>Syncing scan, link, and screenshot history from Supabase database...</p>
          </div>
        ) : unifiedRecords.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            {search ? 'No matching records found for your search.' : t('history.no_records')}
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
              const isImage = record.type === 'image'
              const itemKey = `${record.type}-${record.id}`
              const isDeleting = deletingKey === itemKey

              return (
                <div
                  className="history-item"
                  key={itemKey}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                  }}
                >
                  {/* Image Thumbnail Preview for Screenshots */}
                  {isImage && (
                    <div
                      style={{
                        position: 'relative',
                        width: 76,
                        height: 76,
                        minWidth: 76,
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: 'rgba(147, 51, 234, 0.08)',
                        border: '1px solid rgba(147, 51, 234, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: record.thumbnail ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        if (record.thumbnail) setPreviewImage(record.thumbnail)
                      }}
                      title={record.thumbnail ? 'Click to inspect full image' : 'Screenshot record'}
                    >
                      {record.thumbnail ? (
                        <>
                          <img
                            src={record.thumbnail}
                            alt="Screenshot"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.35)',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                          >
                            <Eye size={18} />
                          </div>
                        </>
                      ) : (
                        <ImageIcon size={32} color="#9333ea" />
                      )}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
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
                          background: isLink
                            ? 'rgba(37, 99, 235, 0.12)'
                            : isImage
                            ? 'rgba(147, 51, 234, 0.12)'
                            : 'rgba(16, 185, 129, 0.12)',
                          color: isLink ? '#2563eb' : isImage ? '#9333ea' : '#059669',
                        }}
                      >
                        {isLink ? (
                          <LinkIcon size={12} />
                        ) : isImage ? (
                          <ImageIcon size={12} />
                        ) : (
                          <MessageSquareWarning size={12} />
                        )}
                        {isLink
                          ? t('history.link_type')
                          : isImage
                          ? t('history.image_type')
                          : t('history.scan_type')}{' '}
                        #{record.id}
                      </span>

                      {/* Vision / Method badge */}
                      {record.badgeLabel && (
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

                      {/* Domain badge for links */}
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

                    {/* Extracted text or URL */}
                    <div style={{ marginTop: 8, marginBottom: 4 }}>
                      {isImage && (
                        <small style={{ color: '#9333ea', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                          {t('history.extracted_text')}:
                        </small>
                      )}
                      <p
                        style={{
                          margin: 0,
                          wordBreak: 'break-all',
                          fontFamily: isLink ? 'monospace' : 'inherit',
                          fontSize: isLink ? '0.95rem' : '1.02rem',
                          color: 'inherit',
                        }}
                      >
                        {record.primaryText}
                      </p>
                    </div>

                    {/* Warnings list for links & screenshots */}
                    {record.warnings && record.warnings.length > 0 && (
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
                            marginBottom: 2,
                          }}
                        >
                          <ShieldAlert size={14} />
                          <span>
                            {isImage ? 'Vision Threat Analysis' : `${record.warnings.length} ${t('history.warnings_found')}`}
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

                      {isImage && record.thumbnail && (
                        <button
                          onClick={() => setPreviewImage(record.thumbnail || null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#9333ea',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Eye size={13} /> View Screenshot
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="history-actions" style={{ flexShrink: 0 }}>
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
                          deleteScanRecord(record.id)
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