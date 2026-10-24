
@'
import { useState } from 'react'
import { ClipboardCheck, ShieldAlert, CheckCircle2 } from 'lucide-react'

type ReviewCase = {
  id: number
  message: string
  risk: string
}

type ReviewDecision = 'Confirmed Scam' | 'Likely Legitimate' | 'Inconclusive'

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
  const [cases, setCases] = useState<ReviewCase[]>(initialCases)
  const [decisions, setDecisions] = useState<Record<number, ReviewDecision>>({})
  const [reviewed, setReviewed] = useState<{ id: number; decision: ReviewDecision }[]>([])

  function submitReview(item: ReviewCase) {
    const decision = decisions[item.id]
    if (!decision) return

    setReviewed((previous) => [...previous, { id: item.id, decision }])
    setCases((previous) => previous.filter((current) => current.id !== item.id))
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

      <div className="content-card">
        <h3>Review Summary</h3>
        <p>Pending cases: {cases.length}</p>
        <p>Reviewed cases: {reviewed.length}</p>
      </div>

      {cases.length === 0 ? (
        <div className="content-card">
          <CheckCircle2 size={28} />
          <h3>All cases reviewed</h3>
          <p>There are no pending demo cases right now.</p>
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
            <label htmlFor={`decision-${item.id}`}>Review decision</label>

            <select
              id={`decision-${item.id}`}
              value={decisions[item.id] || ''}
              onChange={(event) =>
                setDecisions((previous) => ({
                  ...previous,
                  [item.id]: event.target.value as ReviewDecision,
                }))
              }
            >
              <option value="">Select a decision</option>
              <option value="Confirmed Scam">Confirmed Scam</option>
              <option value="Likely Legitimate">Likely Legitimate</option>
              <option value="Inconclusive">Inconclusive</option>
            </select>

            <button
              type="button"
              className="review-submit"
              disabled={!decisions[item.id]}
              onClick={() => submitReview(item)}
            >
              <CheckCircle2 size={18} />
              Submit Review
            </button>
          </div>
        ))
      )}

      {reviewed.length > 0 && (
        <div className="content-card">
          <h3>Review Completed</h3>
          {reviewed.map((item) => (
            <p key={item.id}>
              Case #{item.id}: {item.decision}
            </p>
          ))}
        </div>
      )}

      <p className="disclaimer">
        These are sample cases. Decisions are stored only in the current
        page state and are not saved to a database.
      </p>
    </div>
  )
}

export default HumanReview
'@ | Set-Content -Path .\src\components\pages\HumanReview.tsx -Encoding utf8
