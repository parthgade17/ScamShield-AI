import { useEffect, useState, useCallback } from 'react'
import {
  ClipboardCheck,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Database,
  AlertCircle,
} from 'lucide-react'
import {
  API_BASE_URL,
  SUPABASE_URL,
  SUPABASE_HEADERS,
  dbLogger,
  fetchWithTimeout,
} from '../../api'
import { useLanguage } from '../../context/LanguageContext'

type ReviewCase = {
  id: number
  message: string
  risk_level: string
  risk_score: number
  review_decision?: string | null
}

export default function HumanReview() {
  const { t } = useLanguage()
  const [cases, setCases] = useState<ReviewCase[]>([])
  const [decisions, setDecisions] = useState<Record<number, string>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [savedStatus, setSavedStatus] = useState<Record<number, string>>({})
  const [dataSource, setDataSource] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadReviewQueue = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    const backendUrl = `${API_BASE_URL}/api/reviews`
    dbLogger.info('HumanReview', `Loading review queue from ${backendUrl}...`)

    try {
      // 1. Try Backend API
      const res = await fetchWithTimeout(backendUrl, {}, 4500)
      if (res.ok) {
        const data = await res.json()
        const queue: ReviewCase[] = data.cases || []
        setCases(queue)
        setDataSource('Backend API (Postgres)')
        dbLogger.success('HumanReview', `Loaded ${queue.length} pending review cases from Backend:`, queue)
        return
      }
      throw new Error(`Backend returned HTTP ${res.status}`)
    } catch (backendErr) {
      dbLogger.warn(
        'HumanReview',
        'Backend unreachable. Querying Supabase PostgREST for pending reviews...',
        backendErr instanceof Error ? backendErr.message : String(backendErr)
      )

      // 2. Direct Supabase PostgREST fallback
      try {
        const supaUrl = `${SUPABASE_URL}/rest/v1/scan_history?review_status=eq.pending&order=id.desc`
        const res = await fetchWithTimeout(supaUrl, { headers: SUPABASE_HEADERS }, 5000)
        if (res.ok) {
          const rows = (await res.json()) as Array<{
            id: number
            message: string
            risk_level: string
            risk_score: number
          }>
          setCases(rows)
          setDataSource('Supabase Direct')
          dbLogger.success('HumanReview', `Loaded ${rows.length} pending cases from Supabase Direct:`, rows)
          return
        }
        throw new Error(`Supabase returned HTTP ${res.status}`)
      } catch (supabaseErr) {
        dbLogger.error('HumanReview', 'Failed to load review queue from both Backend and Supabase.', supabaseErr)
        setErrorMessage('Failed to load review queue. Check console for details or click Retry.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReviewQueue()
  }, [loadReviewQueue])

  async function submitDecision(id: number, decision: string) {
    if (!decision) return
    setSubmittingId(id)
    dbLogger.info('HumanReview', `Submitting review decision for case #${id}: ${decision}...`)

    try {
      let saved = false
      // 1. Try backend API
      try {
        const res = await fetchWithTimeout(
          `${API_BASE_URL}/api/reviews/${id}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              decision,
              notes: notes[id] || '',
            }),
          },
          4000
        )
        if (res.ok) saved = true
      } catch {
        // Backend offline
      }

      // 2. Direct Supabase PostgREST update fallback
      if (!saved) {
        const supaUpdate = await fetchWithTimeout(
          `${SUPABASE_URL}/rest/v1/scan_history?id=eq.${id}`,
          {
            method: 'PATCH',
            headers: SUPABASE_HEADERS,
            body: JSON.stringify({
              review_status: 'reviewed',
              review_decision: decision,
              review_notes: notes[id] || '',
              reviewed_at: new Date().toISOString(),
            }),
          },
          4000
        )
        if (supaUpdate.ok) saved = true
      }

      if (saved) {
        setSavedStatus((prev) => ({
          ...prev,
          [id]: `${t('review.saving')} ${decision}`,
        }))
        dbLogger.success('HumanReview', `Saved decision for case #${id}: ${decision}`)
        setTimeout(() => {
          setCases((prev) => prev.filter((c) => c.id !== id))
        }, 1200)
      } else {
        throw new Error('Save response was not ok')
      }
    } catch (err) {
      dbLogger.error('HumanReview', `Failed to submit review for case #${id}:`, err)
      window.alert('Failed to save review decision. Please inspect console.')
    } finally {
      setSubmittingId(null)
    }
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
          <ClipboardCheck size={32} />
          <div>
            <h1>{t('review.title')}</h1>
            <p>{t('review.subtitle')}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              title="Active review queue source"
            >
              <Database size={13} />
              {dataSource}
            </span>
          )}

          <button
            className="icon-button"
            onClick={loadReviewQueue}
            disabled={loading}
            title="Refresh review queue"
          >
            <RefreshCw size={20} className={loading ? 'spinner' : ''} />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            margin: '16px 0',
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
            onClick={loadReviewQueue}
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

      {loading ? (
        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b' }}>
            <RefreshCw size={18} className="spinner" />
            <p>Loading pending review queue from database...</p>
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="content-card">
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h3>{t('review.all_caught_up')}</h3>
            <p style={{ color: 'var(--text-secondary, #6b7280)', marginTop: 8 }}>
              {t('review.no_pending')}
            </p>
          </div>
        </div>
      ) : (
        cases.map((item) => (
          <div className="content-card review-card" key={item.id} style={{ marginBottom: 16 }}>
            <div
              className="review-heading"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={20} color={item.risk_level === 'High' ? '#ef4444' : '#f59e0b'} />
                Case #{item.id}
              </h3>
              <span className="risk-badge">
                {item.risk_level} Risk ({item.risk_score}/100)
              </span>
            </div>

            <p style={{ margin: '14px 0', fontSize: '1.05rem', lineHeight: 1.5 }}>{item.message}</p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                marginTop: 12,
              }}
            >
              <div>
                <label htmlFor={`decision-${item.id}`}>{t('review.verdict_label')}</label>
                <select
                  id={`decision-${item.id}`}
                  value={decisions[item.id] || ''}
                  disabled={submittingId === item.id || Boolean(savedStatus[item.id])}
                  onChange={(event) => {
                    const dec = event.target.value
                    setDecisions((prev) => ({ ...prev, [item.id]: dec }))
                    if (dec) submitDecision(item.id, dec)
                  }}
                >
                  <option value="">{t('review.select_verdict')}</option>
                  <option value="Confirmed Scam">{t('review.confirmed_scam')}</option>
                  <option value="Likely Legitimate">{t('review.likely_legit')}</option>
                  <option value="Inconclusive">{t('review.inconclusive')}</option>
                </select>
              </div>

              <div>
                <label htmlFor={`notes-${item.id}`}>{t('review.notes_label')}</label>
                <input
                  id={`notes-${item.id}`}
                  type="text"
                  placeholder="e.g. Known phishing bank template"
                  value={notes[item.id] || ''}
                  disabled={submittingId === item.id || Boolean(savedStatus[item.id])}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />
              </div>
            </div>

            {submittingId === item.id && (
              <p
                style={{
                  marginTop: 10,
                  color: 'var(--primary, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Loader2 size={16} className="spinner" /> {t('review.saving')}
              </p>
            )}

            {savedStatus[item.id] && (
              <p className="review-result" style={{ marginTop: 10, color: '#10b981', fontWeight: 600 }}>
                ✓ {savedStatus[item.id]}
              </p>
            )}
          </div>
        ))
      )}

      <p className="disclaimer">{t('review.disclaimer')}</p>
    </div>
  )
}
