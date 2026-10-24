import { useState } from 'react'
import { History, Search, Trash2 } from 'lucide-react'

type CaseRecord = {
  id: number
  message: string
  status: string
  date: string
}

const sampleRecords: CaseRecord[] = [
  {
    id: 201,
    message: 'Suspicious bank verification message',
    status: 'High Risk',
    date: '2026-10-20',
  },
  {
    id: 202,
    message: 'Unknown delivery tracking link',
    status: 'Needs Review',
    date: '2026-10-21',
  },
  {
    id: 203,
    message: 'Unexpected payment request',
    status: 'High Risk',
    date: '2026-10-22',
  },
]

function CaseHistory() {
  const [records, setRecords] = useState(sampleRecords)
  const [search, setSearch] = useState('')

  const filteredRecords = records.filter((record) =>
    `${record.message} ${record.status} ${record.id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  return (
    <div className="page-container">
      <div className="page-title">
        <History size={32} />
        <div>
          <h1>Case History</h1>
          <p>Search and view example scam analysis records.</p>
        </div>
      </div>

      <div className="content-card">
        <div className="search-row">
          <Search size={20} />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search cases..."
          />
        </div>

        {filteredRecords.length === 0 ? (
          <p>No matching cases found.</p>
        ) : (
          <div className="history-list">
            {filteredRecords.map((record) => (
              <div className="history-item" key={record.id}>
                <div>
                  <h3>Case #{record.id}</h3>
                  <p>{record.message}</p>
                  <small>{record.date}</small>
                </div>

                <div className="history-actions">
                  <span className="risk-badge">{record.status}</span>

                  <button
                    className="icon-button"
                    aria-label={`Delete case ${record.id}`}
                    onClick={() =>
                      setRecords((previous) =>
                        previous.filter((item) => item.id !== record.id),
                      )
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="disclaimer">
        These are sample records. Deleting a record only removes it
        from the current page state; the changes are not permanent.
      </p>
    </div>
  )
}

export default CaseHistory