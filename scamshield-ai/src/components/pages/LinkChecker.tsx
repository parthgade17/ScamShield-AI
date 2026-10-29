import { useState } from 'react'
import { Link, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react'
import { API_BASE_URL, dbLogger } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

function LinkChecker() {
  const { t } = useLanguage()
  const [url, setUrl] = useState('')
  const [result, setResult] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [riskLevel, setRiskLevel] = useState<string | null>(null)

  const SAMPLE_LINKS = [
    { label: '⚠️ SBI Phishing Portal', url: 'http://sbi-kyc-verify-portal.in/login' },
    { label: '🚫 Raw IP Host Link', url: 'http://192.168.4.102/bank-account' },
    { label: '✅ Legitimate Secure Site', url: 'https://www.onlinesbi.sbi' },
  ]

  async function checkLink() {
    if (!url.trim()) {
      setResult('Please enter a link.')
      setWarnings([])
      setRiskScore(null)
      setRiskLevel(null)
      return
    }

    setLoading(true)
    setResult('')
    setWarnings([])
    setRiskScore(null)
    setRiskLevel(null)

    dbLogger.info('LinkChecker', `Analyzing URL: ${url.trim()}...`)

    try {
      const response = await fetch(`${API_BASE_URL}/api/links/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setRiskScore(data.risk_score)
        setRiskLevel(data.risk_level)
        setWarnings(data.warnings || [])
        dbLogger.success('LinkChecker', 'URL inspection completed:', data)

        if (data.risk_level === 'High') {
          setResult('Caution: High-risk URL warning signs detected!')
        } else if (data.risk_level === 'Medium') {
          setResult('Review Required: Suspicious indicators found.')
        } else {
          setResult('No obvious URL warning signs detected.')
        }
      } else {
        dbLogger.warn('LinkChecker', `Backend check returned status ${response.status}`)
        setResult('Could not complete link analysis. Check URL format.')
      }
    } catch (err) {
      dbLogger.warn('LinkChecker', 'Backend unreachable. Running client heuristics...', err)
      // Fallback to client-side heuristics if offline
      let formattedUrl = url.trim()
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`
      }
      try {
        const parsedUrl = new URL(formattedUrl)
        const detected: string[] = []
        if (parsedUrl.protocol !== 'https:') detected.push('The link does not use HTTPS.')
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsedUrl.hostname)) detected.push('The link uses an IP address.')
        if (parsedUrl.hostname.includes('xn--')) detected.push('The domain contains encoded characters.')
        setWarnings(detected)
        setResult(detected.length > 0 ? 'Review Required (Offline analysis)' : 'No obvious signs found.')
      } catch {
        setResult('Invalid URL. Please enter a valid web address.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-title">
        <Link size={32} />
        <div>
          <h1>{t('links.title')}</h1>
          <p>{t('links.subtitle')}</p>
        </div>
      </div>

      <div className="content-card">
        {/* Quick Sample Links */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Quick Test Examples:
          </span>
          <div className="quick-samples">
            {SAMPLE_LINKS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="sample-chip"
                onClick={() => {
                  setUrl(sample.url)
                  setResult('')
                  setWarnings([])
                  setRiskScore(null)
                  setRiskLevel(null)
                }}
              >
                {sample.label}
              </button>
            ))}
            {url && (
              <button
                type="button"
                className="sample-chip"
                style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                onClick={() => {
                  setUrl('')
                  setResult('')
                  setWarnings([])
                  setRiskScore(null)
                  setRiskLevel(null)
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        <label htmlFor="url" style={{ fontWeight: 600 }}>{t('links.input_label')}</label>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={t('links.placeholder')}
            style={{ flex: 1, minWidth: 260 }}
          />

          <button className="primary-button" onClick={checkLink} disabled={loading} style={{ margin: 0 }}>
            {loading ? <Loader2 size={18} className="spinner" /> : <Link size={18} />}
            {loading ? t('links.checking') : t('links.btn')}
          </button>
        </div>

        {result && (
          <div className="result-box" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {riskLevel === 'High' ? (
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', display: 'grid', placeItems: 'center' }}>
                    <AlertTriangle size={22} color="#ef4444" />
                  </div>
                ) : riskLevel === 'Medium' ? (
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--risk-med-bg)', border: '1px solid var(--risk-med-border)', display: 'grid', placeItems: 'center' }}>
                    <AlertTriangle size={22} color="#f59e0b" />
                  </div>
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)', display: 'grid', placeItems: 'center' }}>
                    <ShieldCheck size={22} color="#10b981" />
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{t('links.result_heading')}</h3>
                  <small style={{ color: 'var(--text-muted)' }}>Security heuristic & reputation check</small>
                </div>
              </div>

              {riskLevel && (
                <span
                  className={`risk-badge ${riskLevel.toLowerCase()}`}
                  style={{ fontSize: 12, padding: '6px 14px' }}
                >
                  {riskLevel} Risk {riskScore !== null ? `(${riskScore}/100)` : ''}
                </span>
              )}
            </div>

            {/* Visual Threat Severity Meter */}
            {riskScore !== null && (
              <div style={{ marginBottom: 18, padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>URL Risk Score</span>
                  <span style={{ color: riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981' }}>{riskScore} / 100</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--border-color)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(5, riskScore))}%`,
                      borderRadius: 4,
                      background: riskScore >= 70 ? '#ef4444' : riskScore >= 40 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            )}

            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{result}</p>

            {warnings.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>Detected Warning Signals:</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {warnings.map((warning) => (
                    <li key={warning} style={{ marginBottom: 4 }}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p style={{ color: 'var(--risk-low-text)', fontSize: 13, margin: '8px 0 14px' }}>
                ✓ No overt phishing signals, IP redirection, or suspicious characters detected in domain structure.
              </p>
            )}

            <p className="disclaimer">
              {t('links.disclaimer')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LinkChecker