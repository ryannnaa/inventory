import { useState } from 'react'
import InventorySearch from './components/InventorySearch'
import CurrentRentals from './components/CurrentRentals'
import DeliverySchedule from './components/DeliverySchedule'
import UpcomingReturns from './components/UpcomingReturns'
import LowAvailabilityAlert from './components/LowAvailabilityAlert'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('search')

  return (
    <div className="app">
      <header className="app-header">
        <h1>📦 Rental Inventory Management System</h1>
        <p>Company ABC - Event Furniture Rental</p>
      </header>

      <nav className="app-nav">
        <button 
          className={currentView === 'search' ? 'active' : ''}
          onClick={() => setCurrentView('search')}
        >
          🔍 Search Inventory
        </button>
        <button 
          className={currentView === 'rentals' ? 'active' : ''}
          onClick={() => setCurrentView('rentals')}
        >
          📋 Current Rentals
        </button>
        <button 
          className={currentView === 'deliveries' ? 'active' : ''}
          onClick={() => setCurrentView('deliveries')}
        >
          🚚 Deliveries
        </button>
        <button 
          className={currentView === 'returns' ? 'active' : ''}
          onClick={() => setCurrentView('returns')}
        >
          ↩️ Upcoming Returns
        </button>
      </nav>

      <main className="app-main">
        <LowAvailabilityAlert />

        <div className="content">
          {currentView === 'search' && <InventorySearch />}
          {currentView === 'rentals' && <CurrentRentals />}
          {currentView === 'deliveries' && <DeliverySchedule />}
          {currentView === 'returns' && <UpcomingReturns />}
        </div>
      </main>

      <footer className="app-footer">
        <p>Rental Inventory Management System v1.0 | Database Final Project</p>
      </footer>
    </div>
  )
}

export default App
