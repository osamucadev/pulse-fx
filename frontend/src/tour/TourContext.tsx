import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { TourContext } from './context'

export function TourProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const startTour = useCallback(() => {
    setStepIndex(0)
    setRun(true)
  }, [])

  const stopTour = useCallback(() => {
    setRun(false)
  }, [])

  const value = useMemo(
    () => ({ run, stepIndex, setStepIndex, startTour, stopTour }),
    [run, stepIndex, startTour, stopTour],
  )

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}
