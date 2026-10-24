
import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  LayoutDashboard,
  ScanSearch,
  Link,
  ClipboardCheck,
  History,
  Settings as SettingsIcon,
  Bell,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Globe,
} from 'lucide-react'

import Dashboard from './components/pages/Dashboard'
import ScamScanner from './components/pages/ScamScanner'
import LinkChecker from './components/pages/LinkChecker'
import HumanReview from './components/pages/HumanReview'
import CaseHistory from './components/pages/CaseHistory'
import Settings from './components/pages/Settings'
import { useLanguage, type Language } from './context/LanguageContext'

import './App.css'

const navItemsConfig = [
  { id: 'Dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { id: 'Scam Scanner', key: 'nav.scam_scanner', icon: ScanSearch },
  { id: 'Link Checker', key: 'nav.link_checker', icon: Link },
  { id: 'Human Review', key: 'nav.human_review', icon: ClipboardCheck },
  { id: 'Case History', key: 'nav.case_history', icon: History },
  { id: 'Settings', key: 'nav.settings', icon: SettingsIcon },
]

function App() {
  const { language, setLanguage, t } = useLanguage()
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('scamshield-theme') === 'dark'
  })

  useEffect(() => {
    localStorage.setItem(
      'scamshield-theme',
      darkMode ? 'dark' : 'light',
    )

    document.documentElement.setAttribute(
      'data-theme',
      darkMode ? 'dark' : 'light',
    )

    document.documentElement.style.colorScheme = darkMode
      ? 'dark'
      : 'light'
  }, [darkMode])

  function navigateTo(page: string) {
    setActivePage(page)
    setSidebarOpen(false)
  }

  function renderPage() {
    switch (activePage) {
      case 'Scam Scanner':
        return <ScamScanner />

      case 'Link Checker':
        return <LinkChecker />

      case 'Human Review':
        return <HumanReview />

      case 'Case History':
        return <CaseHistory />

      case 'Settings':
        return (
          <Settings
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
          />
        )

      default:
        return <Dashboard onNavigate={navigateTo} />
    }
  }

  return (
    <div className={`app-layout ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={27} />
          </div>

          <div className="brand-text">
            <h2>
              ScamShield<span> AI</span>
            </h2>
            <p>DIGITAL SAFETY PLATFORM</p>
          </div>

          <button
            className="mobile-close"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-label">{t('nav.main_menu')}</div>

        <nav className="sidebar-nav">
          {navItemsConfig.map((item) => {
            const Icon = item.icon
            const active = activePage === item.id

            return (
              <button
                key={item.id}
                className={`nav-item ${active ? 'nav-active' : ''}`}
                onClick={() => navigateTo(item.id)}
              >
                <Icon size={20} />
                <span>{t(item.key)}</span>
                {active && <ChevronRight size={17} />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-safety">
          <ShieldCheck size={25} />
          <h3>{t('nav.stay_protected')}</h3>
          <p>{t('nav.stay_protected_desc')}</p>
        </div>

        <div className="sidebar-footer">
          <div className="user-avatar">S</div>

          <div className="user-info">
            <h4>ScamShield User</h4>
            <p>{t('nav.standard_account')}</p>
          </div>

          <LogOut size={18} />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={23} />
            </button>

            <div>
              <p className="breadcrumb">Workspace / {t(`nav.${activePage.toLowerCase().replace(' ', '_')}`)}</p>
              <h2>{t(`nav.${activePage.toLowerCase().replace(' ', '_')}`)}</h2>
            </div>
          </div>

          <div className="topbar-right">
            {/* Multilingual Selector Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--card-background, #f3f4f6)',
                padding: '5px 10px',
                borderRadius: 20,
                border: '1px solid var(--border-color, #e5e7eb)',
              }}
            >
              <Globe size={16} />
              <select
                aria-label="Choose Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  outline: 'none',
                  color: 'inherit',
                }}
              >
                <option value="English">English</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="Marathi">मराठी (Marathi)</option>
              </select>
            </div>

            <div className="system-status">
              <span className="status-dot" />
              {t('nav.demo_mode')}
            </div>

            <button
              className="notification-button"
              aria-label="Notifications"
              title="Demo notifications"
              onClick={() =>
                window.alert(
                  'ScamShield AI Live Protection Active.',
                )
              }
            >
              <Bell size={21} />
              <span />
            </button>

            <button
              className="notification-button"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDarkMode((current) => !current)}
            >
              {darkMode ? <Sun size={21} /> : <Moon size={21} />}
            </button>

            <button
              className="topbar-avatar"
              aria-label="Open settings"
              onClick={() => navigateTo('Settings')}
            >
              S
            </button>
          </div>
        </header>

        <div className="page-content">{renderPage()}</div>

        <footer className="app-footer">
          <p>{t('footer.copyright')}</p>
          <p>{t('footer.tagline')}</p>
        </footer>
      </main>
    </div>
  )
}

export default App
