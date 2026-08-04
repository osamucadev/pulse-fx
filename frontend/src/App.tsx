import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { Footer } from './components/Footer'
import { AboutPage } from './pages/AboutPage'
import { IndicatorDetailPage } from './pages/IndicatorDetailPage'

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <header className="p-8 pb-0">
          <h1 className="text-4xl font-semibold text-primary">Pulse FX</h1>
        </header>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/indicators/:code" element={<IndicatorDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
