import { useState, useEffect } from 'react'

function CurrentRentals() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRentals()
  }, [])

  const loadRentals = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/rentals/current')
      
      if (!response.ok) {
        throw new Error('Failed to load rentals')
      }
      
      const data = await response.json()
      setRentals(data)
      
    } catch (err) {
      setError('Error loading rentals: ' + err.message)
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

  return (
    <div className="current-rentals">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📋 Current Rentals</h2>
        <button className="btn-secondary" onClick={loadRentals}>
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading rentals...</div>
      ) : (
        <>
          <div className="results-summary">
            Total active/upcoming rentals: {rentals.length}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rentals.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                      No active or upcoming rentals found.
                    </td>
                  </tr>
                ) : (
                  rentals.map((rental, idx) => (
                    <tr key={idx}>
                      <td><strong>{rental.product_name}</strong></td>
                      <td>{rental.customer_name}</td>
                      <td>{rental.company_name}</td>
                      <td>{rental.customer_contact}</td>
                      <td>{formatDate(rental.start_date)}</td>
                      <td>{formatDate(rental.end_date)}</td>
                      <td>{rental.duration} days</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: rental.is_active ? '#388e3c' : '#1976d2',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {rental.is_active ? 'ACTIVE' : 'UPCOMING'}
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

export default CurrentRentals
