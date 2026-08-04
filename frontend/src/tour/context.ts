import { createContext } from 'react'

export interface TourContextValue {
  run: boolean
  stepIndex: number
  setStepIndex: (index: number) => void
  startTour: () => void
  stopTour: () => void
}

export const TourContext = createContext<TourContextValue | null>(null)
