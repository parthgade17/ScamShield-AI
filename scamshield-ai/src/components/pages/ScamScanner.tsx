import { useState } from 'react'
import { ScanSearch, AlertTriangle, ShieldCheck } from 'lucide-react'

function ScamScanner() {
  const [message, setMessage] = useState('')
  const [result, setResult] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])

  function scanMessage() {
    if (!message.trim()) {
      setResult('Please enter a message to scan.')
      setWarnings([])
      return
    }

    const detected: string[] = []
    const text = message.toLowerCase()

    if (/otp|password|pin|cvv|verification code/.test(text)) {
      detected.push('Requests sensitive information')
    }

    if (/urgent|immediately|right now|act fast|within 24 hours/.test(text)) {
      detected.push('Uses urgency or pressure')
    }

    if (/account blocked|account suspended|account will close/.test(text)) {
      detected.push('Threatens account suspension')
    }

    if (/send money|transfer money|pay now|processing fee/.test(text)) {
      detected.push('Requests payment or money transfer')
    }

    if (/http:\/\/|https?:\/\/|www\./.test(text)) {
      detected.push('Contains a web link')
    }

    setWarnings(detected)

    if (detected.length >= 2) {
      setResult('High Risk: Multiple warning signs detected.')
    } else if (detected.length === 1) {
      setResult('Needs Caution: A warning sign was detected.')
    } else {
      setResult('No obvious warning signs found.')
    }
  }

  return (
    <div className="page-container">
      <div className="page-title">
        <ScanSearch size={32} />
        <div>
          <h1>Scam Scanner</h1>
          <p>Analyze suspicious messages for common scam indicators.</p>
        </div>
      </div>

      <div className="content-card">
        <label htmlFor="message">
          Paste your suspicious message
        </label>

        <textarea
          id="message"
          rows={7}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Example: Your bank account will be blocked. Verify your account immediately..."
        />

        <button className="primary-button" onClick={scanMessage}>
          <ScanSearch size={18} />
          Scan Message
        </button>

        {result && (
          <div className="result-box">
            <h3>
              {warnings.length >= 2 ? (
                <AlertTriangle size={22} />
              ) : (
                <ShieldCheck size={22} />
              )}
              Scan Result
            </h3>

            <p>{result}</p>

            {warnings.length > 0 && (
              <>
                <h4>Warning Signs</h4>
                <ul>
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </>
            )}

            <p className="disclaimer">
              This is a basic rule-based demonstration, not a
              verified AI fraud detector. A message with no detected
              warning signs may still be fraudulent.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScamScanner