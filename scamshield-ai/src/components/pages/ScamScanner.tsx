import { useState, useRef, useEffect } from 'react'
import {
  ScanSearch,
  AlertTriangle,
  ShieldCheck,
  LoaderCircle,
  Sparkles,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Upload,
} from 'lucide-react'
import { API_BASE_URL, dbLogger } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

type Indicator = {
  source?: string
  category?: string
  title?: string
  description?: string
  message?: string
  indicator?: string
  severity?: string
}

type ScanResponse = {
  scan_id?: number
  ai_score?: number
  rule_based_score?: number
  risk_score?: number
  risk_level?: string
  explanation?: string
  indicators?: (Indicator | string)[]
  recommendations?: string[]
  ai_status?: string
  ai_model?: string
  detection_method?: string
  extracted_text?: string
}

const TRIGGER_REGEX = /\b(urgent|immediately|act now|within \d+ hours?|account blocked|account suspended|last warning|will be blocked|expires today|otp|one.time password|cvv|pin|bank password|upi pin|verification code|send money|pay immediately|processing fee|advance payment|claim fee|refund fee|transfer funds|pay to receive|prize fee|kyc|electricity|free gift|turant|jaldi|tatkal|aaj hi|band ho jayega|block ho jayega|paise|inaam|lottery|विज बिल|ओटीपी|पिन|पासवर्ड|खाता|पैसे|इनाम|लॉटरी|ब्लॉक|तातडीने|लगेच)\b/gi

function riskColor(level?: string) {
  if (level === 'High') return '#ef4444'
  if (level === 'Medium') return '#f59e0b'
  return '#10b981'
}

export default function ScamScanner() {
  const { language, t } = useLanguage()

  const [scanMode, setScanMode] = useState<'text' | 'image'>('text')
  const [message, setMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFileName, setImageFileName] = useState('')

  const [scan, setScan] = useState<ScanResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Voice Speech-to-Text State
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Voice Text-to-Speech State
  const [isSpeaking, setIsSpeaking] = useState(false)

  // User feedback state
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null)

  // Preload speech synthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      const updateVoices = () => {
        window.speechSynthesis.getVoices()
      }
      window.speechSynthesis.onvoiceschanged = updateVoices
      return () => {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // --- Voice Input (Speech Recognition) ---
  function toggleVoiceInput() {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError(t('scanner.voice_err_unsupported'))
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.continuous = false
      recognition.interimResults = false

      // Match recognition language to active rural/regional language
      if (language === 'Hindi') {
        recognition.lang = 'hi-IN'
      } else if (language === 'Marathi') {
        recognition.lang = 'mr-IN'
      } else {
        recognition.lang = 'en-IN'
      }

      recognition.onstart = () => {
        setIsListening(true)
        setError('')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript))
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          setError(t('scanner.voice_err_permission'))
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setIsListening(false)
    }
  }

  // --- Voice Read Aloud (Text-to-Speech in English, Hindi, or Marathi) ---
  function toggleReadAloud() {
    if (!scan) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    // Build natural-sounding verdict spoken text in user's active language
    let textToRead = ''
    let langTag = 'en-IN'

    if (language === 'Hindi') {
      langTag = 'hi-IN'
      const riskText =
        scan.risk_level === 'High' ? 'उच्च' : scan.risk_level === 'Medium' ? 'मध्यम' : 'कम'
      textToRead = `स्कैन परिणाम: जोखिम स्तर ${riskText} है, और जोखिम स्कोर 100 में से ${scan.risk_score ?? 0} है। `
      if (scan.explanation) {
        textToRead += `${scan.explanation} `
      }
      if (scan.recommendations && scan.recommendations.length > 0) {
        textToRead += `सुरक्षा सलाह: ${scan.recommendations[0]}`
      }
    } else if (language === 'Marathi') {
      langTag = 'mr-IN'
      const riskText =
        scan.risk_level === 'High' ? 'उच्च' : scan.risk_level === 'Medium' ? 'मध्यम' : 'कमी'
      textToRead = `स्कॅन निकाल: जोखीम पातळी ${riskText} आहे, आणि जोखीम गुण 100 पैकी ${scan.risk_score ?? 0} आहेत. `
      if (scan.explanation) {
        textToRead += `${scan.explanation} `
      }
      if (scan.recommendations && scan.recommendations.length > 0) {
        textToRead += `सुरक्षा सल्ला: ${scan.recommendations[0]}`
      }
    } else {
      langTag = 'en-IN'
      textToRead = `Scan result: Risk level is ${scan.risk_level}, with a risk score of ${scan.risk_score ?? 0} out of 100. `
      if (scan.explanation) {
        textToRead += `${scan.explanation} `
      }
      if (scan.recommendations && scan.recommendations.length > 0) {
        textToRead += `Recommended action: ${scan.recommendations[0]}`
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToRead)
    utterance.lang = langTag
    utterance.rate = 0.95
    utterance.pitch = 1.0

    // Voice selection with regional fallback
    const voices = window.speechSynthesis.getVoices()
    if (language === 'Hindi') {
      const hiVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.includes('हिन्दी') ||
          v.name.toLowerCase().includes('kalpana') ||
          v.name.toLowerCase().includes('hemant')
      )
      if (hiVoice) {
        utterance.voice = hiVoice
      }
    } else if (language === 'Marathi') {
      // 1. Try to find native Marathi voice
      const mrVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('mr') ||
          v.name.toLowerCase().includes('marathi') ||
          v.name.includes('मराठी') ||
          v.name.toLowerCase().includes('aarohi')
      )
      if (mrVoice) {
        utterance.voice = mrVoice
      } else {
        // 2. High-fidelity fallback: Hindi Devanagari voice accurately pronounces Marathi text
        const hiFallback = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('hi') ||
            v.name.toLowerCase().includes('hindi') ||
            v.name.includes('हिन्दी') ||
            v.name.toLowerCase().includes('kalpana') ||
            v.name.toLowerCase().includes('hemant')
        )
        if (hiFallback) {
          utterance.voice = hiFallback
          utterance.lang = 'hi-IN'
        }
      }
    } else {
      const enVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('en-in') ||
          v.lang.toLowerCase().startsWith('en-gb') ||
          v.lang.toLowerCase().startsWith('en')
      )
      if (enVoice) {
        utterance.voice = enVoice
      }
    }

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.cancel()
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  // --- Image Upload Handler ---
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).')
      return
    }

    setImageFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
      setError('')
      setScan(null)
    }
    reader.readAsDataURL(file)
  }

  // --- Scan Message (Text) ---
  async function scanTextMessage() {
    if (!message.trim()) {
      setError('Please paste a message before scanning.')
      setScan(null)
      return
    }

    setLoading(true)
    setError('')
    setScan(null)
    setFeedbackSubmitted(null)

    dbLogger.info('ScamScanner', `Initiating text scan [language=${language}]...`, message.trim())

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), language }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Scan request failed.')
      }

      dbLogger.success('ScamScanner', 'Scan analysis completed and saved to Supabase:', data)
      setScan(data as ScanResponse)
    } catch (err) {
      dbLogger.error('ScamScanner', 'Text scan failed:', err)
      setError(err instanceof Error ? err.message : 'Scan failed.')
    } finally {
      setLoading(false)
    }
  }

  // --- Scan Screenshot / Image ---
  async function scanImageScreenshot() {
    if (!selectedImage) {
      setError('Please choose or drop an image screenshot first.')
      return
    }

    setLoading(true)
    setError('')
    setScan(null)
    setFeedbackSubmitted(null)

    dbLogger.info('ScamScanner', `Initiating vision/image scan [file=${imageFileName}]...`)

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          filename: imageFileName || 'screenshot.png',
          language,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Vision analysis failed.')
      }

      if (data.scan_id && selectedImage) {
        try {
          localStorage.setItem(`scamshield_img_${data.scan_id}`, selectedImage)
        } catch {
          // localStorage quota safety
        }
      }

      dbLogger.success('ScamScanner', 'Image scan completed and saved to Supabase:', data)
      setScan(data as ScanResponse)
      if (data.extracted_text) {
        setMessage(data.extracted_text)
      }
    } catch (err) {
      dbLogger.error('ScamScanner', 'Image scan failed:', err)
      setError(err instanceof Error ? err.message : 'Image analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  // --- Submit User Accuracy Feedback ---
  async function submitFeedback(feedback: 'accurate' | 'inaccurate') {
    if (!scan?.scan_id) return
    try {
      await fetch(`${API_BASE_URL}/api/scan/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_id: scan.scan_id,
          feedback,
        }),
      })
      setFeedbackSubmitted(feedback)
    } catch (err) {
      console.error('Feedback error:', err)
    }
  }

  // Highlight triggered scam words in user text
  function renderHighlightedText(text: string) {
    if (!text) return null
    const parts = text.split(TRIGGER_REGEX)
    return (
      <div style={{ lineHeight: 1.7, fontSize: '0.98rem' }}>
        {parts.map((part, index) => {
          const isTrigger = TRIGGER_REGEX.test(part)
          TRIGGER_REGEX.lastIndex = 0
          if (isTrigger) {
            return (
              <mark
                key={index}
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid #fca5a5',
                  margin: '0 2px',
                }}
              >
                {part}
              </mark>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </div>
    )
  }

  return (
    <div className="page-container scanner-page">
      <div className="page-title">
        <ScanSearch size={32} />
        <div>
          <h1>{t('scanner.title')}</h1>
          <p>{t('scanner.subtitle')}</p>
        </div>
      </div>

      <div className="content-card">
        {/* Mode Tab Switcher */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border-color, #e5e7eb)', paddingBottom: 10 }}>
          <button
            type="button"
            className="secondary-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: scanMode === 'text' ? '2px solid var(--primary, #2563eb)' : '1px solid #e5e7eb',
              fontWeight: scanMode === 'text' ? 700 : 500,
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
            }}
            onClick={() => setScanMode('text')}
          >
            <FileText size={18} />
            {t('scanner.tab_text')}
          </button>

          <button
            type="button"
            className="secondary-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: scanMode === 'image' ? '2px solid var(--primary, #2563eb)' : '1px solid #e5e7eb',
              fontWeight: scanMode === 'image' ? 700 : 500,
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
            }}
            onClick={() => setScanMode('image')}
          >
            <ImageIcon size={18} />
            {t('scanner.tab_image')}
          </button>
        </div>

        {/* Tab 1: Text Scanning */}
        {scanMode === 'text' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label htmlFor="message-input" style={{ fontWeight: 600 }}>
                {t('scanner.paste_label')}
              </label>

              {/* Voice Speech-to-Text Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={isListening ? t('scanner.voice_listening') : t('scanner.voice_listen')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isListening ? '1px solid #ef4444' : '1px solid var(--border-color, #d1d5db)',
                  background: isListening ? '#fee2e2' : 'var(--card-background, #f9fafb)',
                  color: isListening ? '#b91c1c' : 'inherit',
                }}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                {isListening ? t('scanner.voice_listening') : t('scanner.voice_listen')}
              </button>
            </div>

            <textarea
              id="message-input"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('scanner.placeholder')}
              style={{ width: '100%', marginBottom: 14 }}
            />

            <button
              className="primary-button"
              disabled={loading}
              onClick={scanTextMessage}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {loading ? <LoaderCircle size={18} className="spinner" /> : <Sparkles size={18} />}
              {loading ? t('scanner.scanning') : t('scanner.scan_btn')}
            </button>
          </div>
        )}

        {/* Tab 2: Screenshot & Image Scan */}
        {scanMode === 'image' && (
          <div>
            <div
              style={{
                border: '2px dashed var(--border-color, #d1d5db)',
                borderRadius: 12,
                padding: '30px 20px',
                textAlign: 'center',
                background: 'var(--card-background, #f9fafb)',
                marginBottom: 16,
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('image-file-input')?.click()}
            >
              <Upload size={38} style={{ margin: '0 auto 10px', color: 'var(--primary, #2563eb)' }} />
              <p style={{ fontWeight: 600, marginBottom: 4 }}>
                {imageFileName ? `Selected: ${imageFileName}` : t('scanner.image_upload_prompt')}
              </p>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Supports WhatsApp chats, SMS screenshots, QR codes, payment receipts (PNG, JPG)</p>
              <input
                id="image-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>

            {selectedImage && (
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <img
                  src={selectedImage}
                  alt="Screenshot preview"
                  style={{ maxHeight: 220, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
              </div>
            )}

            <button
              className="primary-button"
              disabled={loading || !selectedImage}
              onClick={scanImageScreenshot}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {loading ? <LoaderCircle size={18} className="spinner" /> : <Sparkles size={18} />}
              {loading ? t('scanner.scanning') : t('scanner.image_btn')}
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }}>
            {error}
          </div>
        )}

        {/* Results Waterfall Box */}
        {scan && (
          <div className="result-box" style={{ marginTop: 24, borderTop: '2px solid #e5e7eb', paddingTop: 20 }}>
            {/* Header with Read-Aloud Voice button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {(scan.risk_score ?? 0) >= 60 ? (
                  <AlertTriangle size={30} color={riskColor(scan.risk_level)} />
                ) : (
                  <ShieldCheck size={30} color={riskColor(scan.risk_level)} />
                )}
                <div>
                  <h3 style={{ margin: 0 }}>{t('scanner.result_title')}</h3>
                  <small style={{ color: '#6b7280' }}>{t('scanner.result_completed')}</small>
                </div>
              </div>

              {/* Voice Read Aloud Button */}
              <button
                type="button"
                className="secondary-button"
                onClick={toggleReadAloud}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                {isSpeaking ? t('scanner.stop_reading') : t('scanner.listen_verdict')}
              </button>
            </div>

            {/* Score Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--card-background, #f8fafc)', border: '1px solid #e5e7eb' }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6b7280' }}>{t('scanner.risk_level')}</p>
                <strong style={{ color: riskColor(scan.risk_level), fontSize: 20 }}>
                  {language === 'Hindi'
                    ? scan.risk_level === 'High' ? 'उच्च' : scan.risk_level === 'Medium' ? 'मध्यम' : 'कम'
                    : language === 'Marathi'
                    ? scan.risk_level === 'High' ? 'उच्च' : scan.risk_level === 'Medium' ? 'मध्यम' : 'कमी'
                    : scan.risk_level}
                  {language !== 'English' ? ` (${scan.risk_level})` : ''}
                </strong>
              </div>

              <div style={{ padding: 14, borderRadius: 10, background: 'var(--card-background, #f8fafc)', border: '1px solid #e5e7eb' }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6b7280' }}>{t('scanner.risk_score')}</p>
                <strong style={{ fontSize: 20 }}>{scan.risk_score ?? 0} / 100</strong>
              </div>

              <div style={{ padding: 14, borderRadius: 10, background: 'var(--card-background, #f8fafc)', border: '1px solid #e5e7eb' }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6b7280' }}>{t('scanner.detection_method')}</p>
                <strong style={{ fontSize: 14, color: 'var(--primary, #2563eb)' }}>
                  {scan.detection_method === 'gemini_vision'
                    ? 'Gemini Vision AI'
                    : 'Rule + Gemini based'}
                </strong>
              </div>
            </div>

            {/* Feature 5: Plain language "Why was this flagged?" */}
            {scan.explanation && (
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.06)', borderLeft: '4px solid #ef4444', marginBottom: 18 }}>
                <h4 style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={18} color="#ef4444" />
                  {t('scanner.why_summary')}
                </h4>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{scan.explanation}</p>
              </div>
            )}

            {/* Feature 5: Word Highlighting in original message */}
            {message && (
              <div style={{ marginBottom: 18, padding: 14, borderRadius: 10, background: 'var(--card-background, #f8fafc)', border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#6b7280' }}>
                  {t('scanner.highlighted_text')}:
                </h4>
                {renderHighlightedText(message)}
              </div>
            )}

            {/* Threat Indicators */}
            {scan.indicators && scan.indicators.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <h4>{t('scanner.indicators_title')}</h4>
                <ul>
                  {scan.indicators.map((item, i) => (
                    <li key={i}>{typeof item === 'string' ? item : item.description || item.title || item.indicator}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Safety Recommendations */}
            {scan.recommendations && scan.recommendations.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4>{t('scanner.recommendations_title')}</h4>
                <ul style={{ paddingLeft: 20 }}>
                  {scan.recommendations.map((rec, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feature 4: User Feedback Button ("Was this accurate?") */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{t('scanner.feedback_title')}</span>
              {feedbackSubmitted ? (
                <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>{t('scanner.feedback_thanks')}</span>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => submitFeedback('accurate')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
                  >
                    <ThumbsUp size={14} />
                    {t('scanner.feedback_yes')}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => submitFeedback('inaccurate')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 13, borderRadius: 6, cursor: 'pointer' }}
                  >
                    <ThumbsDown size={14} />
                    {t('scanner.feedback_no')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
