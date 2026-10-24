
import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  LayoutDashboard,
  ScanSearch,
  History,
  Settings as SettingsIcon,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'

import Dashboard from './components/pages/Dashboard'
import Scanner from './components/pages/Scanner'
import HistoryPage from './components/pages/History'
import Settings from './components/pages/Settings'

import './App.css'

type Page = 'dashboard' | 'scanner' | 'history' | 'settings'

const navigation = [
  {
    id: 'dashboard' as Page,
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'scanner' as Page,
    label: 'Scam Scanner',
    icon: ScanSearch,
  },
  {
    id: 'history' as Page,
    label: 'Scan History',
    icon: History,
  },
  {
    id: 'settings' as Page,
    label: 'Settings',
    icon: SettingsIcon,
  },
]

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Read the saved theme when the app starts.
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scamshield-theme') === 'dark'
    } catch {
      return false
    }
  })

  // Apply the theme and save it whenever darkMode changes.
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

  function navigateTo(page: Page) {
    setActivePage(page)
    setSidebarOpen(false)
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />

      case 'scanner':
        return <Scanner />

      case 'history':
        return <HistoryPage />

      case 'settings':
        return (
          <Settings
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
          />
        )

      default:
        return <Dashboard />
    }
  }

  return (
    <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <ShieldCheck size={28} />
            </div>

            <div className="brand-text">
              <h2>ScamShield</h2>
              <span>AI Protection</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="nav-label">MENU</p>

          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigateTo(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="protection-status">
            <span className="status-dot" />
            <div>
              <strong>Protection Active</strong>
              <p>Scam detection ready</p>
            </div>
          </div>

          <div className="sidebar-footer">
            <ShieldCheck size={16} />
            <span>ScamShield AI</span>
          </div>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-toggle"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div className="breadcrumb">
              <span>ScamShield</span>
              <span className="breadcrumb-separator">/</span>
              <strong>
                {navigation.find((item) => item.id === activePage)?.label}
              </strong>
            </div>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="theme-toggle"
              aria-label={
                darkMode ? 'Switch to light mode' : 'Switch to dark mode'
              }
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDarkMode((previous) => !previous)}
            >
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <div className="user-avatar" title="ScamShield User">
              SU
            </div>
          </div>
        </header>

        <main className="main-content" key={activePage}>
          {renderPage()}
        </main>

        <footer className="app-footer">
          <p>
            © {new Date().getFullYear()} ScamShield AI. Stay safe online.
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
