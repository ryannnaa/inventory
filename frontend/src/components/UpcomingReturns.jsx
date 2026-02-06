import { useState, useEffect } from 'react'

function UpcomingReturns() {
  const [returns, setReturns] = useState([])
  const [daysAhead, setDaysAhead] = useState(7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadReturns()
  }, [daysAhead])

  const loadReturns = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/returns/upcoming?days_ahead=${daysAhead}`)
      
      if (!response.ok) {
        throw new Error('Failed to load upcoming returns')
      }
      
      const data = await response.json()
      setReturns(data)
      
    } catch (err) {
      setError('Error loading returns: ' + err.message)
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getUrgencyColor = (daysUntil) => {
    if (daysUntil === 0) return '#d32f2f'
    if (daysUntil === 1) return '#f57c00'
    if (daysUntil <= 3) return '#fbc02d'
    return '#1976d2'
  }

  const getUrgencyText = (daysUntil) => {
    if (daysUntil === 0) return 'TODAY'
    if (daysUntil === 1) return 'TOMORROW'
    if (daysUntil <= 3) return 'THIS WEEK'
    return `IN ${daysUntil} DAYS`
  }

  return (
    <div className="upcoming-returns">
      <h2>↩️ Upcoming Returns</h2>

      <div className="form-group">
        <label>Show returns for next:</label>
        <select 
          value={daysAhead}
          onChange={(e) => setDaysAhead(e.target.value)}
        >
          <option value="3">3 days</option>
          <option value="7">7 days (1 week)</option>
          <option value="14">14 days (2 weeks)</option>
          <option value="30">30 days (1 month)</option>
        </select>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading upcoming returns...</div>
      ) : (
        <>
          <div className="results-summary">
            Returns in next {daysAhead} days: {returns.length}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Return Date</th>
                  <th>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      No returns scheduled in the next {daysAhead} days.
                    </td>
                  </tr>
                ) : (
                  returns.map((ret, idx) => (
                    <tr key={idx}>
                      <td><strong>{ret.product_name}</strong></td>
                      <td>{ret.customer_name}</td>
                      <td>{ret.customer_contact}</td>
                      <td>{formatDate(ret.return_date)}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getUrgencyColor(ret.days_until_return),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {getUrgencyText(ret.days_until_return)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default UpcomingReturns
