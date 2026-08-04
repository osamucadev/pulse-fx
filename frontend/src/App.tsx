import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { IndicatorDetailPage } from './pages/IndicatorDetailPage'

function App() {
  return (
    <BrowserRouter>
      <main className="min-h-screen">
        <header className="p-8 pb-0">
          <h1 className="text-4xl font-semibold text-primary">Pulse FX</h1>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/indicators/:code" element={<IndicatorDetailPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
