import { useState } from 'react'
import { Link, AlertTriangle, ShieldCheck } from 'lucide-react'

function LinkChecker() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])

  function checkLink() {
    if (!url.trim()) {
      setResult('Please enter a link.')
      setWarnings([])
      return
    }

    let formattedUrl = url.trim()

    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`
    }

    try {
      const parsedUrl = new URL(formattedUrl)
      const detected: string[] = []

      if (parsedUrl.protocol !== 'https:') {
        detected.push('The link does not use HTTPS.')
      }

      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsedUrl.hostname)) {
        detected.push('The link uses an IP address instead of a domain name.')
      }

      if (parsedUrl.hostname.includes('xn--')) {
        detected.push('The domain contains encoded characters.')
      }

      if (parsedUrl.username || parsedUrl.password) {
        detected.push('The URL contains embedded login credentials.')
      }

      if (parsedUrl.hostname.length > 60) {
        detected.push('The domain name is unusually long.')
      }

      setWarnings(detected)

      if (detected.length >= 2) {
        setResult('Caution: Multiple suspicious URL indicators found.')
      } else if (detected.length === 1) {
        setResult('Review Required: A URL warning sign was found.')
      } else {
        setResult('No obvious URL warning signs found.')
      }
    } catch {
      setResult('Invalid URL. Please enter a valid web address.')
      setWarnings([])
    }
  }

  return (
    <div className="page-container">
      <div className="page-title">
        <Link size={32} />
        <div>
          <h1>Link Checker</h1>
          <p>Check URLs for common suspicious characteristics.</p>
        </div>
      </div>

      <div className="content-card">
        <label htmlFor="url">Enter the website link</label>

        <input
          id="url"
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
        />

        <button className="primary-button" onClick={checkLink}>
          <Link size={18} />
          Check Link
        </button>

        {result && (
          <div className="result-box">
            <h3>
              {warnings.length > 0 ? (
                <AlertTriangle size={22} />
              ) : (
                <ShieldCheck size={22} />
              )}
              Link Analysis
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
              This tool does not query a live threat database.
              HTTPS alone does not mean a website is safe.
              Do not open suspicious links just to test them.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LinkChecker