import { useEffect, useState, useCallback } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  ScanSearch,
  Clock,
  ArrowRight,
  Link,
  MessageSquareWarning,
  RefreshCw,
  Database,
  AlertCircle,
} from 'lucide-react'
import {
  API_BASE_URL,
  dbLogger,
  fetchWithTimeout,
  fetchStatsFromSupabase,
  type DashboardStats,
} from '../../api'
import { useLanguage } from '../../context/LanguageContext'

type DashboardProps = {
  onNavigate: (page: string) => void
}

function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats>({
    total_scans: 0,
    high_risk: 0,
    pending_reviews: 0,
    cases_reviewed: 0,
    total_links: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dataSource, setDataSource] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    setErrorMessage(null)

    const statsUrl = `${API_BASE_URL}/api/dashboard/stats`
    dbLogger.info('Dashboard', `Requesting live database statistics from ${statsUrl}...`)

    try {
      // 1. Try Backend API first (SQLAlchemy + Gemini Engine)
      const response = await fetchWithTimeout(statsUrl, {}, 4500)

      if (response.ok) {
        const data = await response.json()
        const newStats: DashboardStats = {
          total_scans: Number(data.total_scans ?? 0),
          high_risk: Number(data.high_risk ?? 0),
          pending_reviews: Number(data.pending_reviews ?? 0),
          cases_reviewed: Number(data.cases_reviewed ?? 0),
          total_links: Number(data.total_links ?? 0),
          source: 'backend',
        }
        setStats(newStats)
        setDataSource('Backend API (Postgres)')
        dbLogger.success('Dashboard', 'Live stats loaded from Backend API:', newStats)
        return
      }

      throw new Error(`Backend returned HTTP status ${response.status}`)
    } catch (backendErr) {
      dbLogger.warn(
        'Dashboard',
        'Backend API query failed or timed out. Activating direct Supabase PostgREST query...',
        backendErr instanceof Error ? backendErr.message : String(backendErr)
      )

      // 2. Failover directly to Supabase PostgREST
      try {
        const supabaseStats = await fetchStatsFromSupabase()
        setStats(supabaseStats)
        setDataSource('Supabase Direct')
        dbLogger.success('Dashboard', 'Live stats retrieved via Supabase Direct failover:', supabaseStats)
      } catch (supabaseErr) {
        dbLogger.error(
          'Dashboard',
          'Both Backend API and Supabase Direct queries failed.',
          supabaseErr,
          'Check network tab in DevTools or run window.__scamshield_debug.testSupabase()'
        )
        setErrorMessage(
          'Unable to reach database. Please check your internet connection or inspect browser console.'
        )
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    // Poll live statistics every 10 seconds to keep counts synchronized
    const interval = setInterval(() => {
      loadStats(false)
    }, 10000)
    return () => clearInterval(interval)
  }, [loadStats])

  return (
    <div className="page-container">
      <div
        className="welcome-section"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          <h1>{t('dashboard.welcome')}</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {dataSource && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontWeight: 600,
              }}
              title="Active live database source"
            >
              <Database size={13} />
              {dataSource}
            </span>
          )}

          <button
            className="secondary-button"
            onClick={() => loadStats(true)}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            title="Refresh Live Statistics"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spinner' : ''} />
            <span>{isRefreshing ? 'Updating...' : 'Live Refresh'}</span>
          </button>
          <ShieldCheck size={64} />
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            margin: '16px 0',
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => loadStats(true)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Retry Now
          </button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <ScanSearch size={25} />
          <p>{t('dashboard.total_scans')}</p>
          <h2>{loading ? '...' : stats.total_scans}</h2>
          <span>{t('dashboard.total_scans_sub')}</span>
        </div>

        <div className="stat-card">
          <AlertTriangle size={25} />
          <p>{t('dashboard.high_risk')}</p>
          <h2>{loading ? '...' : stats.high_risk}</h2>
          <span>{t('dashboard.high_risk_sub')}</span>
        </div>

        <div className="stat-card">
          <Clock size={25} />
          <p>{t('dashboard.pending_reviews')}</p>
          <h2>{loading ? '...' : stats.pending_reviews}</h2>
          <span>{t('dashboard.pending_reviews_sub')}</span>
        </div>

        <div className="stat-card">
          <ShieldCheck size={25} />
          <p>{t('dashboard.cases_reviewed')}</p>
          <h2>{loading ? '...' : stats.cases_reviewed}</h2>
          <span>{t('dashboard.cases_reviewed_sub')}</span>
        </div>
      </div>

      <div className="section-heading">
        <h2>{t('dashboard.quick_actions')}</h2>
        <p>{t('dashboard.quick_actions_sub')}</p>
      </div>

      <div className="actions-grid">
        <button
          className="action-card"
          onClick={() => onNavigate('Scam Scanner')}
        >
          <MessageSquareWarning size={30} />
          <h3>{t('dashboard.scan_msg_title')}</h3>
          <p>{t('dashboard.scan_msg_desc')}</p>
          <span>
            {t('dashboard.scan_msg_btn')} <ArrowRight size={16} />
          </span>
        </button>

        <button
          className="action-card"
          onClick={() => onNavigate('Link Checker')}
        >
          <Link size={30} />
          <h3>{t('dashboard.check_link_title')}</h3>
          <p>{t('dashboard.check_link_desc')}</p>
          <span>
            {t('dashboard.check_link_btn')} <ArrowRight size={16} />
          </span>
        </button>

        <button
          className="action-card"
          onClick={() => onNavigate('Human Review')}
        >
          <ShieldCheck size={30} />
          <h3>{t('dashboard.human_review_title')}</h3>
          <p>{t('dashboard.human_review_desc')}</p>
          <span>
            {t('dashboard.human_review_btn')} <ArrowRight size={16} />
          </span>
        </button>
      </div>

      <div className="safety-banner">
        <AlertTriangle size={25} />
        <div>
          <h3>{t('dashboard.safety_tip_title')}</h3>
          <p>{t('dashboard.safety_tip_desc')}</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard