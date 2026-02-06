import { useState, useEffect } from 'react'

function ProductManagement() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    description: '',
    category_id: ''
  })

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/products')
      
      if (!response.ok) {
        throw new Error('Failed to load products')
      }
      
      const data = await response.json()
      setProducts(data)
      
    } catch (err) {
      setError('Error loading products: ' + err.message)
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      
      if (!response.ok) {
        throw new Error('Failed to load categories')
      }
      
      const data = await response.json()
      setCategories(data)
      
    } catch (err) {
      console.error('Load categories error:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct.sku}` 
        : '/api/products'
      
      const method = editingProduct ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save product')
      }
      
      // Reload products and close modal
      await loadProducts()
      closeModal()
      
    } catch (err) {
      setError('Error saving product: ' + err.message)
      console.error('Save error:', err)
    }
  }

  const handleDelete = async (sku, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }
    
    setError(null)
    
    try {
      const response = await fetch(`/api/products/${sku}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete product')
      }
      
      // Reload products
      await loadProducts()
      
    } catch (err) {
      setError('Error deleting product: ' + err.message)
      console.error('Delete error:', err)
    }
  }

  const handleQuantityAdjust = async (sku, adjustment) => {
    setError(null)
    
    try {
      const response = await fetch(`/api/products/${sku}/quantity`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adjustment })
      })
      
      if (!response.ok) {
        throw new Error('Failed to adjust quantity')
      }
      
      // Reload products
      await loadProducts()
      
    } catch (err) {
      setError('Error adjusting quantity: ' + err.message)
      console.error('Adjust error:', err)
    }
  }

  const openCreateModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      quantity: '',
      description: '',
      category_id: categories.length > 0 ? categories[0].id : ''
    })
    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      quantity: product.quantity,
      description: product.description || '',
      category_id: product.category_id
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      quantity: '',
      description: '',
      category_id: ''
    })
  }

  return (
    <div className="product-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📦 Product Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={loadProducts}>
            🔄 Refresh
          </button>
          <button className="btn-primary" onClick={openCreateModal}>
            ➕ Add New Product
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <>
          <div className="results-summary">
            Total products: {products.length}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                      No products found. Click "Add New Product" to create one.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.sku}>
                      <td><strong>{product.name}</strong></td>
                      <td>{product.category_name || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button 
                            className="btn-secondary"
                            onClick={() => handleQuantityAdjust(product.sku, -1)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            disabled={product.quantity <= 0}
                          >
                            −
                          </button>
                          <strong style={{ minWidth: '30px', textAlign: 'center' }}>
                            {product.quantity}
                          </strong>
                          <button 
                            className="btn-secondary"
                            onClick={() => handleQuantityAdjust(product.sku, 1)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.description || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            className="btn-secondary"
                            onClick={() => openEditModal(product)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(product.sku, product.name)}
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '12px',
                              background: '#d32f2f',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="btn-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Product Name *</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  required
                  style={{ width: '100%' }}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Quantity *</label>
                <input 
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                  min="0"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductManagement
