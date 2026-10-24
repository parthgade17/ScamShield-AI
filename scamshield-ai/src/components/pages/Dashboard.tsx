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
} from 'lucide-react'
import { API_BASE_URL } from '../../api'
import { useLanguage } from '../../context/LanguageContext'

type DashboardProps = {
  onNavigate: (page: string) => void
}

type Stats = {
  total_scans: number
  high_risk: number
  pending_reviews: number
  cases_reviewed: number
  total_links: number
}

function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<Stats>({
    total_scans: 0,
    high_risk: 0,
    pending_reviews: 0,
    cases_reviewed: 0,
    total_links: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats({
          total_scans: data.total_scans ?? 0,
          high_risk: data.high_risk ?? 0,
          pending_reviews: data.pending_reviews ?? 0,
          cases_reviewed: data.cases_reviewed ?? 0,
          total_links: data.total_links ?? 0,
        })
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    // Live update poll every 5 seconds so dashboard always reflects latest scans & reviews
    const interval = setInterval(() => {
      loadStats(false)
    }, 5000)
    return () => clearInterval(interval)
  }, [loadStats])

  return (
    <div className="page-container">
      <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          <h1>{t('dashboard.welcome')}</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="secondary-button"
            onClick={() => loadStats(true)}
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8 }}
            title="Refresh Live Statistics"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spinner' : ''} />
            <span>{isRefreshing ? 'Updating...' : 'Live Refresh'}</span>
          </button>
          <ShieldCheck size={64} />
        </div>
      </div>

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
          <span>{t('dashboard.scan_msg_btn')} <ArrowRight size={16} /></span>
        </button>

        <button
          className="action-card"
          onClick={() => onNavigate('Link Checker')}
        >
          <Link size={30} />
          <h3>{t('dashboard.check_link_title')}</h3>
          <p>{t('dashboard.check_link_desc')}</p>
          <span>{t('dashboard.check_link_btn')} <ArrowRight size={16} /></span>
        </button>

        <button
          className="action-card"
          onClick={() => onNavigate('Human Review')}
        >
          <ShieldCheck size={30} />
          <h3>{t('dashboard.human_review_title')}</h3>
          <p>{t('dashboard.human_review_desc')}</p>
          <span>{t('dashboard.human_review_btn')} <ArrowRight size={16} /></span>
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