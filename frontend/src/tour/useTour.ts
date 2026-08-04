import { useContext } from 'react'
import { TourContext, type TourContextValue } from './context'

export function useTour(): TourContextValue {
  const context = useContext(TourContext)

  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }

  return context
}
