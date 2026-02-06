import { useState } from 'react'

function InventorySearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const searchInventory = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        search_term: searchTerm,
        start_date: startDate || '2024-01-01',
        end_date: endDate || '2024-12-31'
      })
      
      const response = await fetch(`/api/inventory/search?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to search inventory')
      }
      
      const data = await response.json()
      setProducts(data)
      
    } catch (err) {
      setError('Error searching inventory: ' + err.message)
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getAvailabilityStatus = (available, total) => {
    const percentage = (available / total) * 100
    
    if (available === 0) {
      return { text: 'OUT OF STOCK', color: '#d32f2f' }
    } else if (percentage <= 20) {
      return { text: 'CRITICAL', color: '#f57c00' }
    } else if (percentage <= 50) {
      return { text: 'LOW', color: '#fbc02d' }
    } else {
      return { text: 'AVAILABLE', color: '#388e3c' }
    }
  }

  return (
    <div className="inventory-search">
      <h2>🔍 Inventory Search</h2>
      
      <div className="search-controls">
        <div className="form-group">
          <label>Search Product:</label>
          <input 
            type="text" 
            placeholder="Enter product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchInventory()}
          />
        </div>

        <div className="form-group">
          <label>Start Date:</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>End Date:</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={searchInventory}>
          Search
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {products.length > 0 && (
            <div className="results-summary">
              Found {products.length} product(s)
              {startDate && endDate && ` for ${startDate} to ${endDate}`}
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Total Qty</th>
                  <th>Currently Rented</th>
                  <th>Available</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      {searchTerm || startDate || endDate 
                        ? 'No products found. Try a different search.'
                        : 'Enter search criteria and click "Search"'}
                    </td>
                  </tr>
                ) : (
                  products.map(product => {
                    const status = getAvailabilityStatus(
                      product.available_quantity, 
                      product.total_quantity
                    )
                    
                    return (
                      <tr key={product.sku}>
                        <td><strong>{product.name}</strong></td>
                        <td>{product.category_name || 'N/A'}</td>
                        <td>{product.total_quantity}</td>
                        <td>{product.currently_rented}</td>
                        <td><strong>{product.available_quantity}</strong></td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: status.color,
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default InventorySearch
