import { useState } from 'react'
import { ClipboardCheck, ShieldAlert } from 'lucide-react'

type ReviewCase = {
  id: number
  message: string
  risk: string
}

const initialCases: ReviewCase[] = [
  {
    id: 101,
    message: 'Your account is blocked. Verify your OTP immediately.',
    risk: 'High',
  },
  {
    id: 102,
    message: 'Your order has been shipped. Track it using the official app.',
    risk: 'Medium',
  },
]

function HumanReview() {
  const [cases] = useState(initialCases)
  const [decisions, setDecisions] = useState<Record<number, string>>({})

  function reviewCase(id: number, decision: string) {
    setDecisions((previous) => ({
      ...previous,
      [id]: decision,
    }))
  }

  return (
    <div className="page-container">
      <div className="page-title">
        <ClipboardCheck size={32} />
        <div>
          <h1>Human Review</h1>
          <p>Review suspicious cases and record your assessment.</p>
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="content-card">
          <p>No pending demo cases.</p>
        </div>
      ) : (
        cases.map((item) => (
          <div className="content-card review-card" key={item.id}>
            <div className="review-heading">
              <h3>
                <ShieldAlert size={20} />
                Case #{item.id}
              </h3>
              <span className="risk-badge">{item.risk} Risk</span>
            </div>

            <p>{item.message}</p>

            <label htmlFor={`decision-${item.id}`}>
              Review decision
            </label>

            <select
              id={`decision-${item.id}`}
              value={decisions[item.id] || ''}
              onChange={(event) =>
                reviewCase(item.id, event.target.value)
              }
            >
              <option value="">Select a decision</option>
              <option value="Confirmed Scam">Confirmed Scam</option>
              <option value="Likely Legitimate">Likely Legitimate</option>
              <option value="Inconclusive">Inconclusive</option>
            </select>

            {decisions[item.id] && (
              <p className="review-result">
                Recorded locally: {decisions[item.id]}
              </p>
            )}
          </div>
        ))
      )}

      <p className="disclaimer">
        These are sample cases. Review decisions are stored only in
        the current page state and are not saved to a database.
      </p>
    </div>
  )
}

export default HumanReview
