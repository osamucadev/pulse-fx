import { describe, expect, it } from 'vitest'
import { formatLastValue, formatReferenceDate } from './formatIndicator'

describe('formatLastValue', () => {
  it('formats fx values as BRL currency with 4 decimal places', () => {
    expect(formatLastValue('fx', 5.0723)).toBe('R$ 5,0723')
  })

  it('formats macro values as a percentage with 2 decimal places', () => {
    expect(formatLastValue('macro', 14.25)).toBe('14,25%')
  })

  it('returns a placeholder instead of throwing when the value is null', () => {
    expect(formatLastValue('fx', null)).toBe('Sem dados')
    expect(formatLastValue('macro', null)).toBe('Sem dados')
  })
})

describe('formatReferenceDate', () => {
  it('formats an ISO date string in pt-BR (dd/mm/yyyy)', () => {
    expect(formatReferenceDate('2026-08-03T00:00:00.000Z')).toBe('03/08/2026')
  })

  it('returns a placeholder instead of throwing when the date is null', () => {
    expect(formatReferenceDate(null)).toBe('Sem dados')
  })
})
