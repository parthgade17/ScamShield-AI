
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
} from 'lucide-react'

import Dashboard from './components/pages/Dashboard'
import ScamScanner from './components/pages/ScamScanner'
import LinkChecker from './components/pages/LinkChecker'
import HumanReview from './components/pages/HumanReview'
import CaseHistory from './components/pages/CaseHistory'
import Settings from './components/pages/Settings'

import './App.css'

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Scam Scanner', icon: ScanSearch },
  { name: 'Link Checker', icon: Link },
  { name: 'Human Review', icon: ClipboardCheck },
  { name: 'Case History', icon: History },
  { name: 'Settings', icon: SettingsIcon },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load the previously saved theme.
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scamshield-theme') === 'dark'
    } catch {
      return false
    }
  })

  // Apply the theme to the whole application and persist it.
  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light'

    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme

    try {
      localStorage.setItem('scamshield-theme', theme)
    } catch (error) {
      console.error('[ScamShield] Unable to save theme:', error)
    }
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
          type="button"
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
            type="button"
            className="mobile-close"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-label">MAIN MENU</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = activePage === item.name

            return (
              <button
                key={item.name}
                type="button"
                className={`nav-item ${active ? 'nav-active' : ''}`}
                onClick={() => navigateTo(item.name)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} />
                <span>{item.name}</span>
                {active && <ChevronRight size={17} />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-safety">
          <ShieldCheck size={25} />
          <h3>Stay Protected</h3>
          <p>
            Stay alert. Verify unexpected requests before sharing
            personal or financial information.
          </p>
        </div>

        <div className="sidebar-footer">
          <div className="user-avatar">S</div>

          <div className="user-info">
            <h4>ScamShield User</h4>
            <p>Standard Account</p>
          </div>

          <LogOut size={18} />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={23} />
            </button>

            <div>
              <p className="breadcrumb">Workspace / {activePage}</p>
              <h2>{activePage}</h2>
            </div>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="theme-toggle"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDarkMode((previous) => !previous)}
            >
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <div className="system-status">
              <span className="status-dot" />
              Demo Mode
            </div>

            <button
              type="button"
              className="notification-button"
              aria-label="Notifications"
              title="Demo notifications"
              onClick={() =>
                window.alert(
                  'You are viewing ScamShield AI demo mode. No new notifications are available.',
                )
              }
            >
              <Bell size={21} />
              <span />
            </button>

            <button
              type="button"
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
          <p>
            © 2026 ScamShield AI · Built for safer digital commerce
          </p>
          <p>AI-assisted screening · Human-verified response</p>
        </footer>
      </main>
    </div>
  )
}

export default App