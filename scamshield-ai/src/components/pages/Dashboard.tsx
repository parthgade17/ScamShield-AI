import {
  ShieldCheck,
  AlertTriangle,
  ScanSearch,
  Clock,
  ArrowRight,
  Link,
  MessageSquareWarning,
} from 'lucide-react'

type DashboardProps = {
  onNavigate: (page: string) => void
}

function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="page-container">
      <div className="welcome-section">
        <div>
          <p className="eyebrow">YOUR DIGITAL SAFETY CENTER</p>
          <h1>Welcome to ScamShield AI 🛡️</h1>
          <p>
            Detect suspicious messages, check links, and make safer
            decisions online.
          </p>
        </div>

        <ShieldCheck size={70} />
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <ScanSearch size={25} />
          <p>Total Scans</p>
          <h2>248</h2>
          <span>Demo statistics</span>
        </div>

        <div className="stat-card">
          <AlertTriangle size={25} />
          <p>High-Risk Cases</p>
          <h2>32</h2>
          <span>Require attention</span>
        </div>

        <div className="stat-card">
          <Clock size={25} />
          <p>Pending Reviews</p>
          <h2>8</h2>
          <span>Awaiting human review</span>
        </div>

        <div className="stat-card">
          <ShieldCheck size={25} />
          <p>Cases Reviewed</p>
          <h2>64</h2>
          <span>Demo statistics</span>
        </div>
      </div>

      <div className="section-heading">
        <h2>Quick Actions</h2>
        <p>Choose a tool to get started.</p>
      </div>

      <div className="actions-grid">
        <button
          className="action-card"
          onClick={() => onNavigate('Scam Scanner')}
        >
          <MessageSquareWarning size={30} />
          <h3>Scan a Message</h3>
          <p>Check suspicious SMS messages, emails, or chat messages.</p>
          <span>Start scanning <ArrowRight size={16} /></span>
        </button>

        <button
          className="action-card"
          onClick={() => onNavigate('Link Checker')}
        >
          <Link size={30} />
          <h3>Check a Link</h3>
          <p>Inspect a URL for common warning signs.</p>
          <span>Check link <ArrowRight size={16} /></span>
        </button>

        <button
          className="action-card"
          onClick={() => onNavigate('Human Review')}
        >
          <ShieldCheck size={30} />
          <h3>Human Review</h3>
          <p>Review flagged cases and record a human decision.</p>
          <span>Review cases <ArrowRight size={16} /></span>
        </button>
      </div>

      <div className="safety-banner">
        <AlertTriangle size={25} />
        <div>
          <h3>Stay Safe Online</h3>
          <p>
            Never share your OTP, PIN, password, or banking details
            with someone who contacts you unexpectedly.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard