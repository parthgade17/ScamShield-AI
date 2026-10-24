import { useState } from 'react'
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
        return <Settings />

      default:
        return <Dashboard onNavigate={navigateTo} />
    }
  }

  return (
    <div className="app-layout">
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
            <h2>ScamShield<span> AI</span></h2>
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

        <div className="sidebar-label">MAIN MENU</div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = activePage === item.name

            return (
              <button
                key={item.name}
                className={`nav-item ${active ? 'nav-active' : ''}`}
                onClick={() => navigateTo(item.name)}
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
            <div className="system-status">
              <span className="status-dot" />
              Demo Mode
            </div>

            <button
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
            Â© 2026 ScamShield AI Â· Built for safer digital commerce
          </p>
          <p>AI-assisted screening Â· Human-verified response</p>
        </footer>
      </main>
    </div>
  )
}

export default App
