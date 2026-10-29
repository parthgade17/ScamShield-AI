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

  // Quick Test Sample Scam Messages
  const SAMPLE_MESSAGES = [
    {
      label: '⚡ Electricity Threat',
      text: 'Dear customer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately contact electricity officer at 9876543210 to avoid disconnection.',
    },
    {
      label: '🏦 Bank KYC Block',
      text: 'URGENT: Your SBI bank account has been suspended due to incomplete KYC update. Click http://sbi-kyc-verify-portal.in to update your Aadhaar and PAN immediately.',
    },
    {
      label: '🎉 Lucky Draw Winner',
      text: 'Congratulations! Your mobile number won 25 Lakhs in KBC Lucky Draw. Contact Manager Rana Pratap on WhatsApp at 9812345678 to claim your cash reward immediately.',
    },
    {
      label: '💼 Telegram Job Scam',
      text: 'Work from home! Earn Rs. 3000 to 5000 daily by liking YouTube videos and Telegram reviews. Registration fee 500 refundable. WhatsApp 9988776655.',
    },
  ]

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

      // Match recognition language to active language
      const speechLangMap: Record<string, string> = {
        English: 'en-IN',
        Hindi: 'hi-IN',
        Marathi: 'mr-IN',
        Tamil: 'ta-IN',
        Telugu: 'te-IN',
        Kannada: 'kn-IN',
        Malayalam: 'ml-IN',
        Gujarati: 'gu-IN',
        Rajasthani: 'hi-IN',
        Nepali: 'ne-NP',
        Assamese: 'as-IN',
      }
      recognition.lang = speechLangMap[language] || 'en-IN'

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

  // --- Voice Read Aloud (Text-to-Speech in 11 Regional Languages) ---
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

    const risk = scan.risk_level || 'Low'
    const score = scan.risk_score ?? 0
    const explanation = scan.explanation ? `${scan.explanation} ` : ''
    const firstRec = scan.recommendations && scan.recommendations.length > 0 ? scan.recommendations[0] : ''

    switch (language) {
      case 'Hindi': {
        langTag = 'hi-IN'
        const rTxt = risk === 'High' ? 'उच्च' : risk === 'Medium' ? 'मध्यम' : 'कम'
        textToRead = `स्कैन परिणाम: जोखिम स्तर ${rTxt} है, और जोखिम स्कोर 100 में से ${score} है। ${explanation}`
        if (firstRec) textToRead += `सुरक्षा सलाह: ${firstRec}`
        break
      }
      case 'Marathi': {
        langTag = 'mr-IN'
        const rTxt = risk === 'High' ? 'उच्च' : risk === 'Medium' ? 'मध्यम' : 'कमी'
        textToRead = `स्कॅन निकाल: जोखीम पातळी ${rTxt} आहे, आणि जोखीम गुण 100 पैकी ${score} आहेत। ${explanation}`
        if (firstRec) textToRead += `सुरक्षा सल्ला: ${firstRec}`
        break
      }
      case 'Tamil': {
        langTag = 'ta-IN'
        const rTxt = risk === 'High' ? 'அதிகம்' : risk === 'Medium' ? 'நடுத்தரம்' : 'குறைவு'
        textToRead = `ஸ்கேன் முடிவு: ஆபத்து நிலை ${rTxt}, ஆபத்து மதிப்பெண் 100க்கு ${score}. ${explanation}`
        if (firstRec) textToRead += `பாதுகாப்பு பரிந்துரை: ${firstRec}`
        break
      }
      case 'Telugu': {
        langTag = 'te-IN'
        const rTxt = risk === 'High' ? 'అధిక' : risk === 'Medium' ? 'మధ్యస్థ' : 'తక్కువ'
        textToRead = `స్కాన్ ఫలితం: ప్రమాద స్థాయి ${rTxt}, ప్రమాద స్కోరు 100కి ${score}. ${explanation}`
        if (firstRec) textToRead += `భద్రతా సలహా: ${firstRec}`
        break
      }
      case 'Kannada': {
        langTag = 'kn-IN'
        const rTxt = risk === 'High' ? 'ಹೆಚ್ಚು' : risk === 'Medium' ? 'ಮಧ್ಯಮ' : 'ಕಡಿಮೆ'
        textToRead = `ಸ್ಕ್ಯಾನ್ ಫಲಿತಾಂಶ: ಅಪಾಯದ ಮಟ್ಟ ${rTxt}, ಅಪಾಯದ ಅಂಕ 100 ರಲ್ಲಿ ${score}. ${explanation}`
        if (firstRec) textToRead += `ಸುರಕ್ಷತಾ ಸಲಹೆ: ${firstRec}`
        break
      }
      case 'Malayalam': {
        langTag = 'ml-IN'
        const rTxt = risk === 'High' ? 'ഉയർന്നത്' : risk === 'Medium' ? 'ഇടത്തരം' : 'കുറഞ്ഞത്'
        textToRead = `സ്കാൻ ഫലം: അപകടസാധ്യത ${rTxt}, സ്കോർ 100-ൽ ${score}. ${explanation}`
        if (firstRec) textToRead += `സുരക്ഷാ നിർദ്ദേശം: ${firstRec}`
        break
      }
      case 'Gujarati': {
        langTag = 'gu-IN'
        const rTxt = risk === 'High' ? 'ઉચ્ચ' : risk === 'Medium' ? 'મધ્યમ' : 'ઓછું'
        textToRead = `સ્કેન પરિણામ: જોખમ સ્તર ${rTxt} છે, અને જોખમ સ્કોર 100 માંથી ${score} છે. ${explanation}`
        if (firstRec) textToRead += `સુરક્ષા સલાહ: ${firstRec}`
        break
      }
      case 'Rajasthani': {
        langTag = 'hi-IN'
        const rTxt = risk === 'High' ? 'घणो' : risk === 'Medium' ? 'मध्यम' : 'कम'
        textToRead = `स्कैन परिणाम: जोख़म स्तर ${rTxt} है, अर जोख़म स्कोर 100 मांय सूं ${score} है। ${explanation}`
        if (firstRec) textToRead += `बचाव री सलाह: ${firstRec}`
        break
      }
      case 'Nepali': {
        langTag = 'ne-NP'
        const rTxt = risk === 'High' ? 'उच्च' : risk === 'Medium' ? 'मध्यम' : 'कम'
        textToRead = `स्क्यान नतिजा: जोखिम स्तर ${rTxt} छ, र जोखिम स्कोर १०० मा ${score} छ। ${explanation}`
        if (firstRec) textToRead += `सुरक्षा सल्लाह: ${firstRec}`
        break
      }
      case 'Assamese': {
        langTag = 'as-IN'
        const rTxt = risk === 'High' ? 'উচ্চ' : risk === 'Medium' ? 'মধ্যম' : 'কম'
        textToRead = `স্কেন ফলাফল: বিপদৰ মাত্ৰা ${rTxt}, আৰু বিপদৰ স্ক'ৰ ১০০ ৰ ভিতৰত ${score}। ${explanation}`
        if (firstRec) textToRead += `সুৰক্ষা পৰামৰ্শ: ${firstRec}`
        break
      }
      default: {
        langTag = 'en-IN'
        textToRead = `Scan result: Risk level is ${risk}, with a risk score of ${score} out of 100. ${explanation}`
        if (firstRec) textToRead += `Recommended action: ${firstRec}`
        break
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToRead)
    utterance.lang = langTag
    utterance.rate = 0.95
    utterance.pitch = 1.0

    // Voice selection with regional matching and intelligent fallback
    const voices = window.speechSynthesis.getVoices()
    const prefix = langTag.split('-')[0].toLowerCase()

    let matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(prefix))

    // Fallbacks for regional Indian languages without a dedicated engine
    if (!matchedVoice) {
      if (['hi-IN', 'mr-IN', 'ne-NP'].includes(langTag) || language === 'Rajasthani') {
        matchedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('hi') ||
            v.name.toLowerCase().includes('hindi') ||
            v.name.includes('हिन्दी') ||
            v.name.toLowerCase().includes('kalpana')
        )
      } else {
        matchedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('en-in') ||
            v.lang.toLowerCase().startsWith('en')
        )
      }
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice
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
        <div style={{ marginBottom: 20 }}>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-tab ${scanMode === 'text' ? 'active' : ''}`}
              onClick={() => setScanMode('text')}
            >
              <FileText size={16} />
              <span>{t('scanner.tab_text')}</span>
            </button>

            <button
              type="button"
              className={`segmented-tab ${scanMode === 'image' ? 'active' : ''}`}
              onClick={() => setScanMode('image')}
            >
              <ImageIcon size={16} />
              <span>{t('scanner.tab_image')}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Text Scanning */}
        {scanMode === 'text' && (
          <div>
            {/* Quick Test Sample Pills */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Try Sample Threat Message:
              </span>
              <div className="quick-samples">
                {SAMPLE_MESSAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sample-chip"
                    onClick={() => {
                      setMessage(sample.text)
                      setError('')
                      setScan(null)
                    }}
                  >
                    {sample.label}
                  </button>
                ))}
                {message && (
                  <button
                    type="button"
                    className="sample-chip"
                    style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                    onClick={() => {
                      setMessage('')
                      setScan(null)
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label htmlFor="message-input" style={{ fontWeight: 600, margin: 0 }}>
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
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isListening ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  background: isListening ? 'var(--risk-high-bg)' : 'var(--bg-surface)',
                  color: isListening ? 'var(--risk-high)' : 'var(--text-secondary)',
                  animation: isListening ? 'micPulse 1.4s infinite' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
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
          <div className="result-box" style={{ marginTop: 28 }}>
            {/* Header with Read-Aloud Voice button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {(scan.risk_score ?? 0) >= 60 ? (
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', display: 'grid', placeItems: 'center' }}>
                    <AlertTriangle size={24} color={riskColor(scan.risk_level)} />
                  </div>
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)', display: 'grid', placeItems: 'center' }}>
                    <ShieldCheck size={24} color={riskColor(scan.risk_level)} />
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{t('scanner.result_title')}</h3>
                  <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('scanner.result_completed')}</small>
                </div>
              </div>

              {/* Voice Read Aloud Button */}
              <button
                type="button"
                className="secondary-button"
                onClick={toggleReadAloud}
                style={{
                  borderRadius: 20,
                  fontSize: 12.5,
                  padding: '7px 16px',
                  border: isSpeaking ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: isSpeaking ? 'var(--primary-subtle)' : 'var(--bg-card)',
                  color: isSpeaking ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                {isSpeaking ? t('scanner.stop_reading') : t('scanner.listen_verdict')}
              </button>
            </div>

            {/* Visual Risk Severity Meter Bar */}
            <div style={{ marginBottom: 22, padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Threat Severity Meter</span>
                <span style={{ color: riskColor(scan.risk_level) }}>{scan.risk_score ?? 0} / 100 ({scan.risk_level})</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: 'var(--border-color)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(5, scan.risk_score ?? 0))}%`,
                    borderRadius: 5,
                    background: (scan.risk_score ?? 0) >= 70
                      ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                      : (scan.risk_score ?? 0) >= 40
                      ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)'
                      : '#10b981',
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>

            {/* Score Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-muted)' }}>{t('scanner.risk_level')}</p>
                <strong style={{ color: riskColor(scan.risk_level), fontSize: 20, display: 'block' }}>
                  {language === 'Hindi'
                    ? scan.risk_level === 'High' ? 'उच्च' : scan.risk_level === 'Medium' ? 'मध्यम' : 'कम'
                    : language === 'Marathi'
                    ? scan.risk_level === 'High' ? 'उच्च' : scan.risk_level === 'Medium' ? 'मध्यम' : 'कमी'
                    : scan.risk_level}
                  {language !== 'English' ? ` (${scan.risk_level})` : ''}
                </strong>
              </div>

              <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-muted)' }}>{t('scanner.risk_score')}</p>
                <strong style={{ fontSize: 22, color: 'var(--text-primary)', display: 'block' }}>{scan.risk_score ?? 0} / 100</strong>
              </div>

              <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-muted)' }}>{t('scanner.detection_method')}</p>
                <strong style={{ fontSize: 13.5, color: 'var(--primary)', display: 'block' }}>
                  {scan.detection_method === 'gemini_vision'
                    ? '✨ Gemini Vision AI'
                    : '🛡️ Rule + Gemini based'}
                </strong>
              </div>
            </div>

            {/* Feature 5: Plain language "Why was this flagged?" */}
            {scan.explanation && (
              <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', borderLeft: '4px solid var(--risk-high)', marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--risk-high)', fontSize: 14 }}>
                  <Info size={18} />
                  {t('scanner.why_summary')}
                </h4>
                <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-primary)' }}>{scan.explanation}</p>
              </div>
            )}

            {/* Feature 5: Word Highlighting in original message */}
            {message && (
              <div style={{ marginBottom: 20, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
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
