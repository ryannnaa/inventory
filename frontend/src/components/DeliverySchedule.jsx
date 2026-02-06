import { useState, useEffect } from 'react'

function DeliverySchedule() {
  const [deliveries, setDeliveries] = useState([])
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDeliveries()
  }, [selectedDate])

  const loadDeliveries = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/deliveries/schedule?date=${selectedDate}`)
      
      if (!response.ok) {
        throw new Error('Failed to load delivery schedule')
      }
      
      const data = await response.json()
      setDeliveries(data)
      
    } catch (err) {
      setError('Error loading deliveries: ' + err.message)
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#fbc02d'
      case 'out-for-delivery': return '#1976d2'
      case 'delivered': return '#388e3c'
      default: return '#757575'
    }
  }

  return (
    <div className="delivery-schedule">
      <h2>🚚 Delivery Schedule</h2>

      <div className="form-group">
        <label>Select Date:</label>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading delivery schedule...</div>
      ) : (
        <>
          <div className="results-summary">
            Deliveries scheduled for {formatDate(selectedDate)}: {deliveries.length}
          </div>

          {deliveries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No deliveries scheduled for this date.
            </div>
          ) : (
            <div className="delivery-cards">
              {deliveries.map(delivery => (
                <div key={delivery.delivery_id} className="delivery-card">
                  <div className="delivery-header">
                    <h3>{delivery.customer_name}</h3>
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(delivery.delivery_status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {delivery.delivery_status.toUpperCase()}
                    </span>
                  </div>

                  <div className="delivery-info">
                    <p><strong>Contact:</strong> {delivery.customer_contact}</p>
                    <p><strong>Vehicle:</strong> {delivery.license_plate}</p>
                    <p><strong>Address:</strong> {JSON.stringify(delivery.delivery_address)}</p>
                  </div>

                  <div className="delivery-items">
                    <h4>Items to Deliver:</h4>
                    <ul>
                      {delivery.items.map((item, idx) => (
                        <li key={idx}>
                          <strong>{item.product_name}</strong>
                          <br />
                          <small>
                            SKU: {item.sku} | 
                            Rental: {formatDate(item.start_date)} - {formatDate(item.end_date)}
                          </small>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DeliverySchedule
