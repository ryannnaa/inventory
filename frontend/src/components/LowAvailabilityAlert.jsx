import { useState, useEffect } from 'react'

function LowAvailabilityAlert() {
  const [lowStock, setLowStock] = useState([])
  const [threshold, setThreshold] = useState(2)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(true)

  useEffect(() => {
    loadLowStock()
  }, [threshold, startDate, endDate])

  const loadLowStock = async () => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        threshold: threshold
      })
      
      const response = await fetch(`/api/inventory/low-availability?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load low stock items')
      }
      
      const data = await response.json()
      setLowStock(data)
      
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!showAlert) {
    return (
      <div style={{ textAlign: 'center', margin: '10px' }}>
        <button 
          className="btn-secondary"
          onClick={() => setShowAlert(true)}
        >
          Show Low Availability Alert
        </button>
      </div>
    )
  }

  return (
    <div className="low-availability-alert">
      <div className="alert-header">
        <h3>⚠️ Low Availability Alert</h3>
        <button 
          className="btn-close"
          onClick={() => setShowAlert(false)}
        >
          ×
        </button>
      </div>

      <div className="alert-controls">
        <div className="form-group-inline">
          <label>Threshold:</label>
          <input 
            type="number" 
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            min="0"
            max="10"
            style={{ width: '60px' }}
          />
        </div>

        <div className="form-group-inline">
          <label>From:</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-group-inline">
          <label>To:</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Checking availability...</div>
      ) : lowStock.length === 0 ? (
        <div className="alert-success">
          ✓ All products have sufficient availability for the selected period
        </div>
      ) : (
        <div className="alert-items">
          <p><strong>{lowStock.length} product(s) with low availability:</strong></p>
          <ul>
            {lowStock.map(product => (
              <li key={product.sku}>
                <strong>{product.name}</strong>
                <br />
                <span style={{ fontSize: '14px', color: '#666' }}>
                  Available: {product.available_quantity} / {product.total_quantity} 
                  {' '}(Currently rented: {product.rented_quantity})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default LowAvailabilityAlert
