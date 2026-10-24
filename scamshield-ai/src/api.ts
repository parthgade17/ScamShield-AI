/**
 * ScamShield AI - Dual-Engine API & Supabase Connection Layer
 * Supports Flask Backend (Python/Gemini) with automatic failover to direct Supabase PostgREST.
 */

export const SUPABASE_URL: string = (
  import.meta.env.VITE_SUPABASE_URL || 'https://braqdveiscllhubnmaqa.supabase.co'
).replace(/\/+$/, '')

export const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_smnRe-WzTPbS4l2-1CxYpQ_ZrAMn29u'

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

  // 4. Local development default
  return 'http://127.0.0.1:5000'
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
}

/**
 * Query Supabase PostgREST directly for scan history
 */
export async function fetchHistoryFromSupabase(searchQuery?: string): Promise<CaseHistoryItem[]> {
  dbLogger.info('Supabase Direct', 'Querying scan_history directly via PostgREST...')
  const startTime = Date.now()

  let url = `${SUPABASE_URL}/rest/v1/scan_history?select=*&order=id.desc&limit=50`
  if (searchQuery && searchQuery.trim()) {
    const clean = searchQuery.trim().replace(/[%_]/g, '')
    url += `&or=(message.ilike.*${encodeURIComponent(clean)}*,risk_level.ilike.*${encodeURIComponent(clean)}*)`
  }

  const res = await fetchWithTimeout(url, { headers: SUPABASE_HEADERS }, 7000)
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
  }>

  const mapped: CaseHistoryItem[] = rows.map((r) => ({
    id: r.id,
    message: r.message || 'Scanned Content',
    risk_level: r.risk_level || 'Low',
    risk_score: typeof r.risk_score === 'number' ? r.risk_score : 0,
    created_at: r.created_at || null,
    detection_method: r.detection_method || 'rule+Gemini based',
    review_status: r.review_status || 'pending',
  }))

  const latency = Date.now() - startTime
  dbLogger.success(
    'Supabase Direct',
    `Retrieved ${mapped.length} scan records in ${latency}ms from Supabase`,
    mapped
  )
  return mapped
}

/**
 * Query Supabase PostgREST directly to aggregate Dashboard statistics
 */
export async function fetchStatsFromSupabase(): Promise<DashboardStats> {
  dbLogger.info('Supabase Direct', 'Calculating dashboard stats directly from Supabase...')
  const startTime = Date.now()

  // Parallel requests for optimal speed
  const [historyRes, linksRes, reviewsRes] = await Promise.all([
    fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/scan_history?select=id,risk_level,review_status`,
      { headers: SUPABASE_HEADERS },
      6000
    ),
    fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/link_checks?select=id`,
      { headers: SUPABASE_HEADERS },
      6000
    ).catch(() => null),
    fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/human_review?select=id`,
      { headers: SUPABASE_HEADERS },
      6000
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

  const latency = Date.now() - startTime
  dbLogger.success(
    'Supabase Direct',
    `Computed dashboard stats in ${latency}ms from Supabase`,
    stats
  )
  return stats
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
