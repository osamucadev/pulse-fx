import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const decisions = [
  'Stack: Node.js + TypeScript (Express) no backend, PostgreSQL com Prisma como ORM, React + TypeScript (Vite) no frontend, tudo containerizado via Docker Compose.',
  'Indicadores: USD/BRL (BCB, cotação PTAX de venda), Selic (BCB SGS) e Fed Funds Rate (FRED), cobrindo as duas fontes obrigatórias e permitindo comparar juros Brasil x EUA lado a lado.',
  'Sincronização: TTL passivo (o dado atualiza sozinho quando expira) combinado com cooldown de refresh manual, evitando chamadas descontroladas às fontes externas.',
  'Variação percentual: compara com 7 dias úteis atrás para câmbio (fx) e 1 mês de calendário atrás para indicadores macro, sempre usando o último dado conhecido, sem interpolação.',
  'Favoritos: campo isFavorite simples na tabela de indicadores, não uma relação usuário-indicador, porque o MVP é single-user sem autenticação.',
  'Dívidas técnicas conhecidas: gerenciador de pacotes inconsistente entre as pastas (Yarn no frontend, npm no backend); falta de lint configurado no backend; frontend roda em modo dev dentro do Docker, não como build de produção.',
]

export function AboutPage() {
  return (
    <div className="max-w-2xl">
      <Link
        to="/"
        viewTransition
        className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
      >
        <ArrowLeft size={16} />
        Voltar ao dashboard
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold text-gray-900">Sobre o Pulse FX</h1>
        <p className="mt-3 text-sm text-gray-600">
          O Pulse FX é o MVP proposto no desafio técnico full stack da Thomson Reuters, para
          acompanhar câmbio (USD/BRL) e indicadores macroeconômicos (Selic, Fed Funds Rate) a
          partir de fontes públicas (BCB, FRED). Foi pensado para um usuário brasileiro comum
          que acompanha a cotação do dólar no dia a dia para decidir a hora de comprar ou
          vender, não um trader profissional. Os dados são persistidos em PostgreSQL, com API
          própria em Node.js/TypeScript e cliente web em React.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-gray-500">Principais decisões técnicas</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
          {decisions.map((decision) => (
            <li key={decision}>{decision}</li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-2 text-sm font-medium text-primary">
        <a
          href="https://github.com/osamucadev/pulse-fx/blob/main/PLANNING.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 hover:text-primary-hover"
        >
          Ver decisões completas (PLANNING.md)
          <ExternalLink size={14} />
        </a>
        <a
          href="https://github.com/osamucadev/pulse-fx"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 hover:text-primary-hover"
        >
          Ver repositório no GitHub
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  )
}
