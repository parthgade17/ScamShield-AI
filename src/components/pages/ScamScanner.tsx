
import { useState } from 'react'
import {
  ScanSearch,
  AlertTriangle,
  ShieldCheck,
  LoaderCircle,
  Info,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'

type Indicator = {
  name: string
  points: number
  evidence: string
}

type ScanResult = {
  risk_score: number
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical'
  explanation: string
  indicators: Indicator[]
  recommendations: string[]
  detection_method: string
}

const API_URL = 'http://127.0.0.1:5000/api/scan'

function ScamScanner() {
  const [message, setMessage] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function scanMessage() {
    if (!message.trim()) {
      setError('Please enter a message to scan.')
      setScanResult(null)
      return
    }

    if (message.length > 10000) {
      setError('Your message must be 10,000 characters or fewer.')
      setScanResult(null)
      return
    }

    setLoading(true)
    setError('')
    setScanResult(null)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to analyze this message.')
      }

      setScanResult(data as ScanResult)
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : 'An unexpected error occurred.'

      if (
        err instanceof TypeError ||
        messageText.toLowerCase().includes('fetch')
      ) {
        setError(
          'Cannot connect to the detection server. Make sure Flask is running at http://127.0.0.1:5000.'
        )
      } else {
        setError(messageText)
      }
    } finally {
      setLoading(false)
    }
  }

  function clearScanner() {
    setMessage('')
    setScanResult(null)
    setError('')
  }

  const riskClass = scanResult?.risk_level.toLowerCase() ?? ''

  return (
    <div className="page-container scam-scanner-page">
      <div className="page-title">
        <ScanSearch size={32} />
        <div>
          <h1>Scam Scanner</h1>
          <p>
            Analyze suspicious SMS messages, emails, and payment requests.
          </p>
        </div>
      </div>

      <div className="content-card scam-input-card">
        <div className="scam-section-heading">
          <div>
            <h2>Message Analysis</h2>
            <p>Paste the suspicious message below to check for warning signs.</p>
          </div>
          <ShieldCheck size={28} />
        </div>

        <label htmlFor="scam-message">
          Suspicious message
        </label>

        <textarea
          id="scam-message"
          rows={7}
          maxLength={10000}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value)
            setError('')
          }}
          placeholder="Example: Your bank account will be blocked. Verify your OTP immediately..."
          disabled={loading}
        />

        <div className="scam-input-footer">
          <span>{message.length}/10,000 characters</span>
          <span>Do not enter real passwords, OTPs, or sensitive personal data.</span>
        </div>

        <div className="scam-actions">
          <button
            className="primary-button"
            onClick={scanMessage}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <LoaderCircle size={18} className="scam-spin" />
            ) : (
              <ScanSearch size={18} />
            )}
            {loading ? 'Analyzing...' : 'Analyze Message'}
          </button>

          <button
            className="scam-clear-button"
            onClick={clearScanner}
            disabled={loading}
            type="button"
          >
            <RefreshCw size={16} />
            Clear
          </button>
        </div>

        {error && (
          <div className="scam-error" role="alert">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="content-card scam-loading-card" role="status">
          <LoaderCircle size={28} className="scam-spin" />
          <div>
            <h3>Analyzing your message</h3>
            <p>Checking the message for known scam indicators...</p>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="scam-results" aria-live="polite">
          <div className={`content-card scam-risk-card risk-${riskClass}`}>
            <div className="scam-result-header">
              <div className="scam-result-icon">
                {scanResult.risk_score >= 45 ? (
                  <AlertTriangle size={28} />
                ) : (
                  <ShieldCheck size={28} />
                )}
              </div>
              <div>
                <span className="scam-eyebrow">SCAN COMPLETE</span>
                <h2>{scanResult.risk_level} Risk</h2>
                <p>{scanResult.explanation}</p>
              </div>
            </div>

            <div className="scam-score-area">
              <div className="scam-score-label">
                <span>Risk Score</span>
                <strong>{scanResult.risk_score}/100</strong>
              </div>

              <div
                className="scam-score-track"
                role="progressbar"
                aria-label="Scam risk score"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={scanResult.risk_score}
              >
                <div
                  className="scam-score-fill"
                  style={{ width: `${scanResult.risk_score}%` }}
                />
              </div>

              <div className="scam-score-scale">
                <span>Lower risk</span>
                <span>Higher risk</span>
              </div>
            </div>

            <div className="scam-method-note">
              <Info size={16} />
              <span>
                Analysis method: {scanResult.detection_method === 'rule_based'
                  ? 'Rule-based detection'
                  : scanResult.detection_method}
              </span>
            </div>
          </div>

          <div className="content-card scam-detail-card">
            <div className="scam-section-heading">
              <div>
                <h2>Detected Warning Signs</h2>
                <p>
                  {scanResult.indicators.length === 0
                    ? 'No known warning patterns matched this message.'
                    : `${scanResult.indicators.length} warning indicator(s) detected.`}
                </p>
              </div>
              {scanResult.indicators.length > 0 ? (
                <AlertTriangle size={24} />
              ) : (
                <CheckCircle2 size={24} />
              )}
            </div>

            {scanResult.indicators.length > 0 ? (
              <ul className="scam-indicator-list">
                {scanResult.indicators.map((indicator, index) => (
                  <li key={`${indicator.name}-${index}`}>
                    <div className="scam-indicator-icon">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="scam-indicator-content">
                      <strong>{indicator.name}</strong>
                      <p>{indicator.evidence}</p>
                    </div>
                    <span className="scam-indicator-points">
                      +{indicator.points}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="scam-no-indicators">
                <ShieldCheck size={22} />
                <p>
                  No known indicators were detected. This does not guarantee
                  that the message is safe.
                </p>
              </div>
            )}
          </div>

          <div className="content-card scam-detail-card">
            <div className="scam-section-heading">
              <div>
                <h2>Recommended Safety Actions</h2>
                <p>Steps you can take to protect yourself.</p>
              </div>
              <ShieldCheck size={24} />
            </div>

            <ul className="scam-recommendation-list">
              {scanResult.recommendations.map((recommendation, index) => (
                <li key={`${recommendation}-${index}`}>
                  <CheckCircle2 size={19} />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="scam-disclaimer">
            <Info size={18} />
            <p>
              This version uses predefined rules, not a trained AI model.
              Scores are heuristic estimates, not calibrated probabilities.
              A low score does not prove a message is safe. Verify important
              requests through official channels.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScamScanner
