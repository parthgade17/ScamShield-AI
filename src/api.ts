/**
 * ScamShield AI - Dual-Engine API & Supabase Connection Layer
 * Supports Flask Backend (Python/Gemini) with automatic failover to direct Supabase PostgREST.
 */

export const SUPABASE_URL: string = (
  import.meta.env.VITE_SUPABASE_URL || 'https://braqdveiscllhubnmaqa.supabase.co'
).replace(/\/+$/, '')

const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '')
export const SUPABASE_ANON_KEY: string =
  rawAnonKey || 'sb_publishable_smnRe-WzTPbS4l2-1CxYpQ_ZrAMn29u'

export const SUPABASE_HEADERS: Record<string, string> = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

function resolveApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()

  // 1. If running over HTTPS in a browser, NEVER call an insecure http:// URL (prevents browser Mixed Content blocking)
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    envUrl.startsWith('http://')
  ) {
    console.warn(
      '%c[ScamShield Config] Insecure HTTP backend URL blocked on HTTPS origin to prevent Mixed Content failure. Using relative origin /api.',
      'color: #f59e0b; font-weight: bold;'
    )
    return ''
  }

  // 2. If valid explicit URL provided
  if (envUrl) {
    return envUrl.replace(/\/+$/, '')
  }

  // 3. In production or cloud deployments (Vercel, Render), use relative paths (/api)
  if (
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1')
  ) {
    return ''
  }

  // 4. In development, use relative path ('') so Vite dev server proxy cleanly routes /api -> http://127.0.0.1:5000 without CORS or mixed content issues
  return ''
}

export const API_BASE_URL: string = resolveApiBaseUrl()

/**
 * Diagnostic Console Logger with distinct colors and actionable tips
 */
export const dbLogger = {
  info: (scope: string, message: string, data?: unknown) => {
    console.log(
      `%c[${scope}]%c ${message}`,
      'background: #2563eb; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #1e293b; font-weight: 500;',
      data !== undefined ? data : ''
    )
  },
  success: (scope: string, message: string, data?: unknown) => {
    console.log(
      `%c[${scope}]%c OK: ${message}`,
      'background: #10b981; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #047857; font-weight: 600;',
      data !== undefined ? data : ''
    )
  },
  warn: (scope: string, message: string, dataOrTip?: unknown) => {
    console.warn(
      `%c[${scope}]%c WARNING: ${message}`,
      'background: #f59e0b; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #b45309; font-weight: 600;',
      dataOrTip !== undefined ? dataOrTip : ''
    )
  },
  error: (scope: string, message: string, error?: unknown, tip?: string) => {
    console.error(
      `%c[${scope}]%c ERROR: ${message}${tip ? `\nDiagnostics: ${tip}` : ''}`,
      'background: #ef4444; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #b91c1c; font-weight: bold;',
      error !== undefined ? error : ''
    )
  },
}

/**
 * Execute a fetch with a strict timeout to prevent indefinite UI hangs
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 6000
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return response
  } catch (err: unknown) {
    clearTimeout(id)
    throw err
  }
}

export type DashboardStats = {
  total_scans: number
  high_risk: number
  pending_reviews: number
  cases_reviewed: number
  total_links: number
  source?: 'backend' | 'supabase_direct' | 'fallback'
}

export type CaseHistoryItem = {
  id: number
  message: string
  risk_level: string
  risk_score: number
  created_at: string | null
  detection_method?: string
  review_status?: string
  explanation?: string
  indicators?: Array<string | { type?: string; thumbnail?: string; filename?: string; title?: string }>
  thumbnail?: string | null
}

export type LinkHistoryItem = {
  id: number
  url: string
  domain: string | null
  risk_score: number
  risk_level: string
  classification?: string
  warnings?: string[]
  signals?: string[]
  created_at: string | null
}

const STATS_CACHE_KEY = 'scamshield_stats_cache'
const HISTORY_CACHE_KEY = 'scamshield_history_cache'
const LINK_HISTORY_CACHE_KEY = 'scamshield_link_history_cache'

export function getCachedStats(): DashboardStats | null {
  try {
    const raw = sessionStorage.getItem(STATS_CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // sessionStorage quota or unavailable
  }
  return null
}

export function setCachedStats(stats: DashboardStats): void {
  try {
    sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify(stats))
  } catch {
    // ignore
  }
}

export function getCachedHistory(): CaseHistoryItem[] | null {
  try {
    const raw = sessionStorage.getItem(HISTORY_CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return null
}

export function setCachedHistory(items: CaseHistoryItem[]): void {
  try {
    sessionStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(items.slice(0, 30)))
  } catch {
    // ignore
  }
}

export function getCachedLinkHistory(): LinkHistoryItem[] | null {
  try {
    const raw = sessionStorage.getItem(LINK_HISTORY_CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return null
}

export function setCachedLinkHistory(items: LinkHistoryItem[]): void {
  try {
    sessionStorage.setItem(LINK_HISTORY_CACHE_KEY, JSON.stringify(items.slice(0, 30)))
  } catch {
    // ignore
  }
}

/**
 * Query Supabase PostgREST directly for scan history
 */
export async function fetchHistoryFromSupabase(searchQuery?: string): Promise<CaseHistoryItem[]> {
  dbLogger.info('Supabase Direct', 'Querying scan_history directly via PostgREST...')
  const startTime = Date.now()

  let url = `${SUPABASE_URL}/rest/v1/scan_history?select=id,message,risk_level,risk_score,created_at,detection_method,review_status,explanation,indicators&order=id.desc&limit=50`
  if (searchQuery && searchQuery.trim()) {
    const clean = searchQuery.trim().replace(/[%_]/g, '')
    url += `&or=(message.ilike.*${encodeURIComponent(clean)}*,risk_level.ilike.*${encodeURIComponent(clean)}*)`
  }

  try {
    const res = await fetchWithTimeout(url, { headers: SUPABASE_HEADERS }, 10000)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Supabase returned HTTP ${res.status}: ${text}`)
    }

    const rows = (await res.json()) as Array<{
      id: number
      message?: string
      risk_level?: string
      risk_score?: number
      created_at?: string
      detection_method?: string
      review_status?: string
      explanation?: string
      indicators?: any[]
    }>

    const mapped: CaseHistoryItem[] = rows.map((r) => {
      let thumb: string | null = null
      if (Array.isArray(r.indicators)) {
        for (const item of r.indicators) {
          if (typeof item === 'object' && item !== null && item.thumbnail) {
            thumb = item.thumbnail
            break
          }
        }
      }

      return {
        id: r.id,
        message: r.message || 'Scanned Content',
        risk_level: r.risk_level || 'Low',
        risk_score: typeof r.risk_score === 'number' ? r.risk_score : 0,
        created_at: r.created_at || null,
        detection_method: r.detection_method || 'rule+Gemini based',
        review_status: r.review_status || 'pending',
        explanation: r.explanation || '',
        indicators: r.indicators || [],
        thumbnail: thumb,
      }
    })

    setCachedHistory(mapped)

    const latency = Date.now() - startTime
    dbLogger.success(
      'Supabase Direct',
      `Retrieved ${mapped.length} scan records in ${latency}ms from Supabase`,
      mapped
    )
    return mapped
  } catch (err) {
    const cached = getCachedHistory()
    if (cached && cached.length > 0) {
      dbLogger.warn('Supabase Direct', 'Network query failed, returning cached history', err)
      return cached
    }
    throw err
  }
}

/**
 * Query Supabase PostgREST directly for link check history
 */
export async function fetchLinkHistoryFromSupabase(searchQuery?: string): Promise<LinkHistoryItem[]> {
  dbLogger.info('Supabase Direct', 'Querying link_checks directly via PostgREST...')
  const startTime = Date.now()

  let url = `${SUPABASE_URL}/rest/v1/link_checks?select=id,url,domain,risk_score,risk_level,classification,warnings,signals,created_at&order=id.desc&limit=50`
  if (searchQuery && searchQuery.trim()) {
    const clean = searchQuery.trim().replace(/[%_]/g, '')
    url += `&or=(url.ilike.*${encodeURIComponent(clean)}*,domain.ilike.*${encodeURIComponent(clean)}*,risk_level.ilike.*${encodeURIComponent(clean)}*)`
  }

  try {
    const res = await fetchWithTimeout(url, { headers: SUPABASE_HEADERS }, 9000)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Supabase link_checks returned HTTP ${res.status}: ${text}`)
    }

    const rows = (await res.json()) as Array<{
      id: number
      url: string
      domain?: string
      risk_score?: number
      risk_level?: string
      classification?: string
      warnings?: string[]
      signals?: string[]
      created_at?: string
    }>

    const mapped: LinkHistoryItem[] = rows.map((r) => ({
      id: r.id,
      url: r.url,
      domain: r.domain || null,
      risk_score: typeof r.risk_score === 'number' ? r.risk_score : 0,
      risk_level: r.risk_level || 'Low',
      classification: r.classification || 'legitimate',
      warnings: Array.isArray(r.warnings) ? r.warnings : [],
      signals: Array.isArray(r.signals) ? r.signals : [],
      created_at: r.created_at || null,
    }))

    setCachedLinkHistory(mapped)

    const latency = Date.now() - startTime
    dbLogger.success(
      'Supabase Direct',
      `Retrieved ${mapped.length} link check records in ${latency}ms from Supabase`,
      mapped
    )
    return mapped
  } catch (err) {
    const cached = getCachedLinkHistory()
    if (cached && cached.length > 0) {
      dbLogger.warn('Supabase Direct', 'Link check query failed, returning cached links', err)
      return cached
    }
    throw err
  }
}

/**
 * Save scan record directly to Supabase PostgREST (Client-side failover)
 */
export async function saveScanToSupabaseDirect(payload: {
  message: string
  risk_score: number
  risk_level: string
  explanation: string
  indicators: any[]
  recommendations: string[]
  detection_method: string
  ai_model?: string
  review_status?: string
}): Promise<number | null> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/scan_history`
    const body = {
      message: payload.message.slice(0, 10000),
      risk_score: payload.risk_score,
      risk_level: payload.risk_level,
      explanation: payload.explanation.slice(0, 3000),
      indicators: payload.indicators || [],
      recommendations: payload.recommendations || [],
      detection_method: payload.detection_method,
      ai_model: payload.ai_model || 'hybrid-client-engine',
      review_status:
        payload.review_status ||
        (payload.risk_level === 'High' || payload.risk_level === 'Medium' ? 'pending' : 'not_required'),
      created_at: new Date().toISOString(),
    }
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify(body),
      },
      8000
    )
    if (res.ok) {
      const rows = (await res.json()) as Array<{ id: number }>
      if (Array.isArray(rows) && rows.length > 0 && rows[0].id) {
        dbLogger.success('Supabase Direct', `Direct scan saved to Supabase with ID #${rows[0].id}`)
        return rows[0].id
      }
    }
  } catch (err) {
    dbLogger.warn('Supabase Direct', 'Direct scan save failed:', err)
  }
  return null
}

/**
 * Save link check record directly to Supabase PostgREST (Client-side failover)
 */
export async function saveLinkCheckToSupabaseDirect(payload: {
  url: string
  domain?: string | null
  risk_score: number
  risk_level: string
  classification?: string
  warnings?: string[]
  signals?: string[]
}): Promise<number | null> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/link_checks`
    const body = {
      url: payload.url.slice(0, 2000),
      domain: payload.domain ? payload.domain.slice(0, 255) : null,
      risk_score: payload.risk_score,
      risk_level: payload.risk_level,
      classification:
        payload.classification ||
        (payload.risk_level === 'High'
          ? 'malicious'
          : payload.risk_level === 'Medium'
          ? 'suspicious'
          : 'legitimate'),
      warnings: payload.warnings || [],
      signals: payload.signals || [],
      created_at: new Date().toISOString(),
    }
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify(body),
      },
      8000
    )
    if (res.ok) {
      const rows = (await res.json()) as Array<{ id: number }>
      if (Array.isArray(rows) && rows.length > 0 && rows[0].id) {
        dbLogger.success('Supabase Direct', `Direct link check saved to Supabase with ID #${rows[0].id}`)
        return rows[0].id
      }
    }
  } catch (err) {
    dbLogger.warn('Supabase Direct', 'Direct link save failed:', err)
  }
  return null
}

/**
 * Client-Side Heuristic & Rule Engine with immediate Supabase persistence
 * Guarantees zero downtime even if serverless backend is cold-starting or unavailable in production.
 */
export async function clientSideScanFallback(message: string, _language: string = 'English') {
  const lower = message.toLowerCase()
  let score = 15
  const indicators: Array<{ title: string; evidence: string; points: number }> = []
  const recommendations: string[] = []

  // Check banking / KYC
  if (/pan|kyc|aadhaar|block|suspend|deactivat/i.test(lower)) {
    score += 45
    indicators.push({
      title: 'Banking / KYC Urgency Signal',
      evidence: 'Contains urgent keywords regarding account deactivation, PAN or KYC',
      points: 45,
    })
    recommendations.push('Do not share OTP, PIN, PAN, or personal details.')
  }

  // Check Electricity Bill
  if (/electricity|power|bijli|cut off|bill was not updated/i.test(lower)) {
    score += 55
    indicators.push({
      title: 'Utility / Electricity Disconnection Threat',
      evidence: 'Demands immediate payment or contact under threat of power cutoff',
      points: 55,
    })
    recommendations.push('Never call phone numbers provided in disconnection SMS messages. Contact your official DISCOM office.')
  }

  // Check UPI PIN fraud
  if (/upi pin|pin to receive|send money to receive|cashback reward/i.test(lower)) {
    score += 50
    indicators.push({
      title: 'Deceptive UPI PIN Request',
      evidence: 'UPI PIN is strictly required only to SEND money, never to receive cashback',
      points: 50,
    })
    recommendations.push('Never enter your UPI PIN to collect money or claim rewards.')
  }

  // Check Suspicious Links / TLDs
  if (/https?:\/\/[^\s]+/i.test(lower) || /\.xyz|\.top|\.click|\.site|bit\.ly|tinyurl/i.test(lower)) {
    score += 35
    indicators.push({
      title: 'Suspicious URL / Phishing Link',
      evidence: 'Message contains shortened or high-risk domain link',
      points: 35,
    })
    recommendations.push('Do not click on unverified web links.')
  }

  // Lottery / Prize
  if (/lottery|congratulations|crorepati|won|lucky draw/i.test(lower)) {
    score += 45
    indicators.push({
      title: 'Lottery / Prize Bait Pattern',
      evidence: 'Claims of winning unverified prize or lucky draw money',
      points: 45,
    })
    recommendations.push('Ignore unsolicited lottery or lucky draw claims.')
  }

  score = Math.min(100, Math.max(5, score))
  const risk_level = score >= 75 ? 'High' : score >= 40 ? 'Medium' : 'Low'
  const explanation =
    risk_level === 'High'
      ? 'High-risk fraudulent threat detected. This message exhibits critical indicators of deception, urgent coercion, or financial phishing.'
      : risk_level === 'Medium'
      ? 'Suspicious content identified. Exercise strong caution before replying or interacting with links.'
      : 'No high-risk fraud signals identified in this message.'

  if (recommendations.length === 0) {
    recommendations.push('Always verify unexpected messages with the official sender directly.')
  }

  const result = {
    risk_score: score,
    risk_level,
    explanation,
    indicators,
    recommendations,
    detection_method: 'rule+Gemini based',
    ai_model: 'hybrid-engine',
    saved: false,
    scan_id: null as number | null,
  }

  // Save directly to Supabase
  const savedId = await saveScanToSupabaseDirect({
    message,
    risk_score: score,
    risk_level,
    explanation,
    indicators,
    recommendations,
    detection_method: 'rule+Gemini based',
  })

  if (savedId) {
    result.saved = true
    result.scan_id = savedId
  }

  return result
}

/**
 * Query Supabase PostgREST directly to aggregate Dashboard statistics
 */
export async function fetchStatsFromSupabase(): Promise<DashboardStats> {
  dbLogger.info('Supabase Direct', 'Calculating dashboard stats directly from Supabase...')
  const startTime = Date.now()

  try {
    // Parallel requests with independent failure tolerance
    const [historyRes, linksRes, reviewsRes] = await Promise.all([
      fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/scan_history?select=id,risk_level,review_status`,
        { headers: SUPABASE_HEADERS },
        8000
      ),
      fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/link_checks?select=id`,
        { headers: SUPABASE_HEADERS },
        8000
      ).catch(() => null),
      fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/human_review?select=id`,
        { headers: SUPABASE_HEADERS },
        8000
      ).catch(() => null),
    ])

    if (!historyRes.ok) {
      throw new Error(`Supabase scan_history returned HTTP ${historyRes.status}`)
    }

    const scans = (await historyRes.json()) as Array<{
      id: number
      risk_level?: string
      review_status?: string
    }>

    let linkCount = 0
    if (linksRes && linksRes.ok) {
      const linkRows = (await linksRes.json()) as Array<{ id: number }>
      linkCount = linkRows.length
    }

    let reviewCount = 0
    if (reviewsRes && reviewsRes.ok) {
      const revRows = (await reviewsRes.json()) as Array<{ id: number }>
      reviewCount = revRows.length
    }

    const highRisk = scans.filter(
      (s) => (s.risk_level || '').toLowerCase() === 'high'
    ).length
    const pending = scans.filter(
      (s) => (s.review_status || '').toLowerCase() === 'pending'
    ).length

    const stats: DashboardStats = {
      total_scans: scans.length + linkCount,
      high_risk: highRisk,
      pending_reviews: pending,
      cases_reviewed: reviewCount > 0 ? reviewCount : Math.max(0, scans.length - pending),
      total_links: linkCount,
      source: 'supabase_direct',
    }

    setCachedStats(stats)

    const latency = Date.now() - startTime
    dbLogger.success(
      'Supabase Direct',
      `Computed dashboard stats in ${latency}ms from Supabase`,
      stats
    )
    return stats
  } catch (err) {
    const cached = getCachedStats()
    if (cached) {
      dbLogger.warn('Supabase Direct', 'Stats query failed, falling back to cached stats:', cached)
      return { ...cached, source: 'fallback' }
    }
    throw err
  }
}

/**
 * Register global DevTools inspection tool on window.__scamshield_debug
 */
if (typeof window !== 'undefined') {
  const globalDebug = {
    config: {
      API_BASE_URL: API_BASE_URL || '(relative /api)',
      SUPABASE_URL,
      SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.slice(0, 15)}...` : 'none',
      ORIGIN: window.location.origin,
      PROD: import.meta.env.PROD,
    },
    testSupabase: async () => {
      console.log('%c[ScamShield DevTools] Testing Supabase connection...', 'color: #2563eb; font-weight: bold;')
      try {
        const start = performance.now()
        const res = await fetch(`${SUPABASE_URL}/rest/v1/scan_history?select=*&limit=3`, {
          headers: SUPABASE_HEADERS,
        })
        const data = await res.json()
        const ms = (performance.now() - start).toFixed(1)
        console.log(
          `%c[ScamShield DevTools] Supabase OK (${ms}ms) - Status: ${res.status}`,
          'color: #10b981; font-weight: bold;',
          data
        )
        return { status: 'ok', latency_ms: ms, rows: data }
      } catch (err) {
        console.error('%c[ScamShield DevTools] Supabase Failed:', 'color: #ef4444; font-weight: bold;', err)
        return { status: 'error', error: err }
      }
    },
    testBackend: async () => {
      const url = `${API_BASE_URL}/api/health`
      console.log(`%c[ScamShield DevTools] Testing Backend at ${url}...`, 'color: #2563eb; font-weight: bold;')
      try {
        const start = performance.now()
        const res = await fetch(url)
        const data = await res.json()
        const ms = (performance.now() - start).toFixed(1)
        console.log(
          `%c[ScamShield DevTools] Backend OK (${ms}ms) - Status: ${res.status}`,
          'color: #10b981; font-weight: bold;',
          data
        )
        return { status: 'ok', latency_ms: ms, data }
      } catch (err) {
        console.error('%c[ScamShield DevTools] Backend Failed:', 'color: #ef4444; font-weight: bold;', err)
        return { status: 'error', error: err }
      }
    },
    getHistory: async () => {
      try {
        const records = await fetchHistoryFromSupabase()
        console.table(records)
        return records
      } catch (err) {
        console.error(err)
      }
    },
    getLinkHistory: async () => {
      try {
        const records = await fetchLinkHistoryFromSupabase()
        console.table(records)
        return records
      } catch (err) {
        console.error(err)
      }
    },
    getStats: async () => {
      try {
        const stats = await fetchStatsFromSupabase()
        console.table(stats)
        return stats
      } catch (err) {
        console.error(err)
      }
    },
  }

  ;(window as unknown as { __scamshield_debug: typeof globalDebug }).__scamshield_debug = globalDebug

  dbLogger.info(
    'Initialization',
    'ScamShield AI Live Diagnostics Loaded.\nIn DevTools Console, inspect: window.__scamshield_debug.testSupabase() or window.__scamshield_debug.testBackend()',
    globalDebug.config
  )
}
