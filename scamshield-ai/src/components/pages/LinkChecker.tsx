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
        <label htmlFor="url">{t('links.input_label')}</label>

        <input
          id="url"
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={t('links.placeholder')}
        />

        <button className="primary-button" onClick={checkLink} disabled={loading}>
          {loading ? <Loader2 size={18} className="spinner" /> : <Link size={18} />}
          {loading ? t('links.checking') : t('links.btn')}
        </button>

        {result && (
          <div className="result-box">
            <h3>
              {riskLevel === 'High' ? (
                <AlertTriangle size={22} color="#ef4444" />
              ) : riskLevel === 'Medium' ? (
                <AlertTriangle size={22} color="#f59e0b" />
              ) : (
                <ShieldCheck size={22} color="#10b981" />
              )}
              {t('links.result_heading')} {riskScore !== null && `(${riskScore}/100 Risk)`}
            </h3>

            <p>{result}</p>

            {warnings.length > 0 && (
              <ul>
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
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