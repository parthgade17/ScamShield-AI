import { useEffect, useState } from 'react'
import { ClipboardCheck, ShieldAlert, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react'
import { API_BASE_URL } from '../../api'
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

  async function loadReviewQueue() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`)
      if (res.ok) {
        const data = await res.json()
        setCases(data.cases || [])
      }
    } catch (err) {
      console.error('Failed to load review queue:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviewQueue()
  }, [])

  async function submitDecision(id: number, decision: string) {
    if (!decision) return
    setSubmittingId(id)
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes: notes[id] || '',
        }),
      })

      if (res.ok) {
        setSavedStatus((prev) => ({
          ...prev,
          [id]: `${t('review.saving')} ${decision}`,
        }))
        // Remove from pending cases after short delay
        setTimeout(() => {
          setCases((prev) => prev.filter((c) => c.id !== id))
        }, 1200)
      }
    } catch (err) {
      console.error('Failed to submit review:', err)
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="page-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ClipboardCheck size={32} />
          <div>
            <h1>{t('review.title')}</h1>
            <p>{t('review.subtitle')}</p>
          </div>
        </div>

        <button
          className="icon-button"
          onClick={loadReviewQueue}
          disabled={loading}
          title="Refresh review queue"
        >
          <RefreshCw size={20} className={loading ? 'spinner' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="content-card">
          <p>Loading pending review queue from database...</p>
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
            <div className="review-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={20} color={item.risk_level === 'High' ? '#ef4444' : '#f59e0b'} />
                Case #{item.id}
              </h3>
              <span className="risk-badge">
                {item.risk_level} Risk ({item.risk_score}/100)
              </span>
            </div>

            <p style={{ margin: '14px 0', fontSize: '1.05rem', lineHeight: 1.5 }}>{item.message}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
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
              <p style={{ marginTop: 10, color: 'var(--primary, #2563eb)', display: 'flex', alignItems: 'center', gap: 6 }}>
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

      <p className="disclaimer">
        {t('review.disclaimer')}
      </p>
    </div>
  )
}
