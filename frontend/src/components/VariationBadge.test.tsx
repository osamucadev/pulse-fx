import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VariationBadge } from './VariationBadge'

describe('VariationBadge', () => {
  it('renders a TrendingUp icon in the success color for a positive variation', () => {
    const { container } = render(<VariationBadge variationPercent={5} />)

    expect(container.querySelector('.lucide-trending-up')).toBeInTheDocument()
    expect(container.querySelector('span')).toHaveClass('text-success')
  })

  it('renders a TrendingDown icon in the danger color for a negative variation', () => {
    const { container } = render(<VariationBadge variationPercent={-5} />)

    expect(container.querySelector('.lucide-trending-down')).toBeInTheDocument()
    expect(container.querySelector('span')).toHaveClass('text-danger')
  })

  it('renders a neutral Minus icon in a neutral color for a zero variation', () => {
    const { container } = render(<VariationBadge variationPercent={0} />)

    expect(container.querySelector('.lucide-minus')).toBeInTheDocument()
    expect(container.querySelector('span')).toHaveClass('text-gray-400')
  })

  it('renders a neutral Minus icon instead of breaking when variation is null', () => {
    const { container } = render(<VariationBadge variationPercent={null} />)

    expect(container.querySelector('.lucide-minus')).toBeInTheDocument()
    expect(container.querySelector('span')).toHaveClass('text-gray-400')
  })
})
