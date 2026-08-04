import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HelpCircle, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { resetData } from '../api/client'
import { useTour } from '../tour/useTour'
import { ConfirmModal } from './ConfirmModal'

export function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const { startTour } = useTour()

  const resetMutation = useMutation({
    mutationFn: resetData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] })
      setIsModalOpen(false)
      setFeedback('Dados reiniciados com sucesso.')
      navigate('/', { viewTransition: true })
      setTimeout(() => setFeedback(null), 4000)
    },
    onError: (error) => {
      console.error('Failed to reset data', error)
      setFeedback('Não foi possível reiniciar os dados. Tente novamente.')
      setTimeout(() => setFeedback(null), 4000)
    },
  })

  function handleRevisitTour() {
    if (location.pathname !== '/') {
      navigate('/', { viewTransition: true })
    }

    startTour()
  }

  return (
    <footer data-tour="app-footer" className="w-full border-t border-gray-100 px-8 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          Este projeto tem finalidade educacional e de demonstração técnica. As informações
          exibidas não constituem recomendação de investimento.
        </p>

        <div className="flex items-center gap-3">
          {feedback && <span className="text-xs text-gray-500">{feedback}</span>}
          <Link
            to="/about"
            viewTransition
            className="text-xs font-medium text-gray-500 transition-colors hover:text-primary"
          >
            Sobre
          </Link>
          <button
            type="button"
            onClick={handleRevisitTour}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-primary"
          >
            <HelpCircle size={14} />
            Revisitar tour
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-primary"
          >
            <RotateCcw size={14} />
            Reiniciar teste
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        title="Reiniciar teste"
        message="Isso vai apagar todos os dados sincronizados (histórico e últimos valores) de todos os indicadores. O catálogo de indicadores continua existindo, mas será preciso sincronizar novamente. Deseja continuar?"
        confirmLabel="Reiniciar"
        isConfirming={resetMutation.isPending}
        onConfirm={() => resetMutation.mutate()}
        onCancel={() => setIsModalOpen(false)}
      />
    </footer>
  )
}
