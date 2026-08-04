import { Toaster } from 'sonner'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { Footer } from './components/Footer'
import { PageLayout } from './components/PageLayout'
import { AboutPage } from './pages/AboutPage'
import { IndicatorDetailPage } from './pages/IndicatorDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="flex min-h-screen flex-col">
        <header className="p-8 pb-0">
          <h1 className="text-4xl font-semibold text-primary">Pulse FX</h1>
          <p className="mt-1 text-sm text-gray-500">
            Câmbio e indicadores macroeconômicos a partir de fontes públicas
          </p>
        </header>
        <main className="flex-1">
          <PageLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/indicators/:code" element={<IndicatorDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </PageLayout>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
