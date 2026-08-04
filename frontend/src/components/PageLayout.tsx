import type { ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10">{children}</div>
}
